(function () {
  var STORAGE_KEY = 'asterion.progress.v1';
  var PROFILE_ID = 'local-static-student';
  var CSV_HEADERS = [
    'export_timestamp',
    'topic',
    'route_page_type',
    'activity_type',
    'item_id',
    'attempt_timestamp',
    'answer_result_summary',
    'deterministic_pass_fail',
    'self_marked_score',
    'evidence_label',
    'mastery_eligibility_label',
    'suspicion_flags'
  ];
  var TARGETED_MISTAKE_PROMPTS = {
    'algebra slip': 'I made an algebra error when...',
    'wrong identity': 'I used the wrong identity because...',
    'domain/range issue': 'I forgot to check the domain when...',
    notation: 'My notation stopped the method from being clear when...',
    calculator: 'My calculator setup was wrong because...',
    'method choice': 'I lost the method mark because...',
    'incomplete reasoning': 'My reasoning was incomplete because...',
    'sign error': 'I made a sign error when...',
    'coefficient error': 'I made a coefficient error when...',
    'forgot constant': 'I forgot the constant when...'
  };

  function createId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  function emptyProgress() {
    return {
      schemaVersion: 1,
      attempts: [],
      learningActivityAttempts: [],
      skillCheckAttempts: [],
      topicProfiles: {},
      issueReports: [],
      regionLearning: {},
      settings: { activePaperFamily: 'p3' }
    };
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function isSkillCheckAttemptRecord(value) {
    return Boolean(value && typeof value === 'object'
      && value.course === 'p3'
      && typeof value.attemptId === 'string'
      && typeof value.topic === 'string'
      && typeof value.skillId === 'string'
      && typeof value.checkId === 'string'
      && typeof value.submittedAnswer === 'string'
      && typeof value.isCorrect === 'boolean'
      && typeof value.usedHint === 'boolean'
      && typeof value.revealedAnswer === 'boolean'
      && typeof value.revealedRepairStep === 'boolean'
      && Array.isArray(value.mistakeTags)
      && value.mistakeTags.every(function (tag) { return typeof tag === 'string'; })
      && typeof value.timestamp === 'string');
  }

  function normalizeSkillCheckAttempts(records) {
    return safeArray(records).filter(isSkillCheckAttemptRecord);
  }

  function loadProgress() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return emptyProgress();
      return Object.assign(emptyProgress(), parsed, {
        attempts: safeArray(parsed.attempts),
        learningActivityAttempts: safeArray(parsed.learningActivityAttempts),
        skillCheckAttempts: normalizeSkillCheckAttempts(parsed.skillCheckAttempts),
        topicProfiles: parsed.topicProfiles && typeof parsed.topicProfiles === 'object' ? parsed.topicProfiles : {},
        issueReports: safeArray(parsed.issueReports),
        regionLearning: parsed.regionLearning && typeof parsed.regionLearning === 'object' ? parsed.regionLearning : {},
        settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : { activePaperFamily: 'p3' }
      });
    } catch (_error) {
      return emptyProgress();
    }
  }

  function saveProgress(progress) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return progress;
  }

  function csvCell(value) {
    var cell = value === undefined || value === null || value === ''
      ? ''
      : Array.isArray(value) ? value.filter(Boolean).join('|') : String(value);
    return /[",\n\r]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
  }

  function csvRow(row) {
    return CSV_HEADERS.map(function (header) { return csvCell(row[header]); }).join(',');
  }

  function blankCsvRow(exportTimestamp) {
    return CSV_HEADERS.reduce(function (row, header) {
      row[header] = header === 'export_timestamp' ? exportTimestamp : '';
      return row;
    }, {});
  }

  function skillCheckCsvRow(attempt, exportTimestamp) {
    var passed = isPassingSkillCheckAttempt(attempt);
    return Object.assign(blankCsvRow(exportTimestamp), {
      topic: attempt.topic || '',
      route_page_type: 'skill-check',
      activity_type: 'Skill Check',
      item_id: attempt.checkId || '',
      attempt_timestamp: attempt.timestamp || '',
      answer_result_summary: attempt.submittedAnswer || '',
      deterministic_pass_fail: passed ? 'pass' : 'fail',
      evidence_label: passed ? 'Deterministic Skill Check evidence' : 'Skill Check attempt',
      mastery_eligibility_label: passed ? 'mastery_gate_passed_for_this_check' : 'not_passed'
    });
  }

  function reviewCsvRow(attempt, exportTimestamp) {
    var tags = safeArray(attempt.mistakeTags).filter(Boolean);
    var isCandidate = tags.length > 0 || !attempt.isCorrect || attempt.revealedAnswer || attempt.revealedRepairStep;
    if (!isCandidate) return undefined;
    var state = attempt.revealedAnswer
      ? 'answer_revealed'
      : attempt.revealedRepairStep ? 'repair_revealed' : attempt.isCorrect ? 'tagged_review' : 'incorrect';
    return Object.assign(blankCsvRow(exportTimestamp), {
      topic: attempt.topic || '',
      route_page_type: 'review',
      activity_type: 'Review',
      item_id: attempt.checkId || '',
      attempt_timestamp: attempt.timestamp || '',
      answer_result_summary: state,
      deterministic_pass_fail: 'not_available',
      evidence_label: 'Review candidate from local Skill Check attempt',
      mastery_eligibility_label: 'not_mastery_evidence',
      suspicion_flags: tags.join('|')
    });
  }

  function examCsvRow(attempt, exportTimestamp) {
    var score = typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0
      ? attempt.marksEarned + '/' + attempt.marksAvailable
      : typeof attempt.marksEarned === 'number' ? String(attempt.marksEarned) : '';
    var masteryLabel = attempt.masteryGate === 'skill_check_passed'
      ? 'skill_check_passed_exam_supports_confidence'
      : 'not_mastery_evidence_by_itself';
    return Object.assign(blankCsvRow(exportTimestamp), {
      topic: attempt.topicDisplayName || '',
      route_page_type: 'exam-training',
      activity_type: 'Exam Training',
      item_id: attempt.questionId || '',
      attempt_timestamp: attempt.attemptedAt || '',
      answer_result_summary: attempt.mistakeType || '',
      deterministic_pass_fail: 'not_available',
      self_marked_score: score,
      evidence_label: attempt.evidenceLabel || (attempt.selfMarked ? 'Self-marked attempt' : 'Exam practice evidence'),
      mastery_eligibility_label: masteryLabel,
      suspicion_flags: safeArray(attempt.suspicionFlags).join('|')
    });
  }

  function learningCsvRow(attempt, exportTimestamp) {
    var isLearnMode = attempt.activityType === 'learn_mode';
    return Object.assign(blankCsvRow(exportTimestamp), {
      topic: attempt.topic || attempt.regionId || '',
      route_page_type: isLearnMode ? 'learn' : 'field-guide',
      activity_type: isLearnMode ? 'Learn Mode' : (attempt.activityType || 'Field Guide'),
      item_id: attempt.activityId || attempt.id || '',
      attempt_timestamp: attempt.completedAt || attempt.createdAt || '',
      answer_result_summary: attempt.submittedAnswer || attempt.prompt || '',
      deterministic_pass_fail: typeof attempt.isCorrect === 'boolean' ? (attempt.isCorrect ? 'pass' : 'fail') : 'not_available',
      evidence_label: 'Local learning activity',
      mastery_eligibility_label: attempt.strongEvidence ? 'clean_checked_learning_attempt' : 'not_mastery_evidence',
      suspicion_flags: safeArray(attempt.mistakeTags).join('|')
    });
  }

  function buildLocalProgressCsv(progress, exportTimestamp) {
    var skillRows = normalizeSkillCheckAttempts(progress.skillCheckAttempts).flatMap(function (attempt) {
      return [skillCheckCsvRow(attempt, exportTimestamp), reviewCsvRow(attempt, exportTimestamp)].filter(Boolean);
    });
    var examRows = safeArray(progress.attempts).map(function (attempt) {
      return examCsvRow(attempt, exportTimestamp);
    });
    var learningRows = safeArray(progress.learningActivityAttempts).map(function (attempt) {
      return learningCsvRow(attempt, exportTimestamp);
    });
    return [CSV_HEADERS.join(',')].concat(skillRows, examRows, learningRows).map(function (row) {
      return typeof row === 'string' ? row : csvRow(row);
    }).join('\n');
  }

  function downloadTextFile(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportLocalProgressCsv(button) {
    var progress = loadProgress();
    var timestamp = new Date().toISOString();
    var csv = buildLocalProgressCsv(progress, timestamp);
    var compactDate = timestamp.replace(/[:.]/g, '-');
    downloadTextFile('asterion-local-progress-' + compactDate + '.csv', csv, 'text/csv;charset=utf-8');
    var status = button.closest('[data-export-panel]')?.querySelector('[data-export-status]');
    if (status) {
      var rowCount = Math.max(0, csv.split('\n').length - 1);
      status.textContent = 'CSV export prepared from this browser: ' + rowCount + ' row' + (rowCount === 1 ? '' : 's') + '.';
    }
  }

  function completionsFor(progress, regionId) {
    var record = progress.regionLearning && progress.regionLearning[regionId];
    var completions = record && record.fieldGuideTopicCompletions;
    return completions && typeof completions === 'object' ? completions : {};
  }

  function fieldGuideCompletedCount(progress, regionId, total) {
    var record = progress.regionLearning && progress.regionLearning[regionId];
    if (record && record.fieldGuideCompletedAt) return total;
    return Math.min(total, Object.keys(completionsFor(progress, regionId)).length);
  }

  function attemptsForRegion(progress, regionId) {
    return progress.attempts.filter(function (attempt) {
      return attempt.validatedRegionId === regionId || attempt.displayRegionId === regionId;
    });
  }

  function skillAttemptsForRegion(progress, regionId) {
    return progress.skillCheckAttempts.filter(function (attempt) {
      return attempt.regionId === regionId;
    });
  }

  function passingSkillAttemptsForRegion(progress, regionId) {
    return skillAttemptsForRegion(progress, regionId).filter(isPassingSkillCheckAttempt);
  }

  function isPassingSkillCheckAttempt(attempt) {
    return Boolean(isSkillCheckAttemptRecord(attempt) && attempt.isCorrect && !attempt.revealedAnswer && !attempt.revealedRepairStep);
  }

  function parseRequiredCheckIds(node) {
    try {
      var parsed = JSON.parse(node.getAttribute('data-required-checks') || '[]');
      return Array.isArray(parsed) ? parsed.filter(function (id) { return typeof id === 'string' && id; }) : [];
    } catch (_error) {
      return [];
    }
  }

  function passedCheckIds(progress, requiredCheckIds, regionId) {
    return requiredCheckIds.filter(function (checkId) {
      return progress.skillCheckAttempts.some(function (attempt) {
        return attempt.regionId === regionId && attempt.checkId === checkId && isPassingSkillCheckAttempt(attempt);
      });
    });
  }

  function p3Attempts(progress) {
    return attemptsForPaperFamily(progress, 'p3');
  }

  function attemptsForPaperFamily(progress, paperFamily) {
    return progress.attempts.filter(function (attempt) {
      return String(attempt.paperFamily).toLowerCase() === String(paperFamily || 'p3').toLowerCase();
    });
  }

  function paperFamilyLabel(paperFamily) {
    var normalized = String(paperFamily || 'p3').toLowerCase();
    if (normalized === 'p1') return 'Paper 1';
    if (normalized === 'p4') return 'Mechanics 1';
    if (normalized === 'p5') return 'Statistics 1';
    return 'Paper 3';
  }

  function scoreRatioForAttempt(attempt) {
    if (typeof attempt.scoreRatio === 'number' && Number.isFinite(attempt.scoreRatio)) return attempt.scoreRatio;
    if (typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0) {
      return attempt.marksEarned / attempt.marksAvailable;
    }
    return undefined;
  }

  function markPointCountsForAttempt(attempt) {
    var fromParts = safeArray(attempt.partScores).reduce(function (counts, part) {
      return {
        ticked: counts.ticked + safeArray(part.markPointIds).length,
        available: counts.available + Number(part.markPointsAvailable || 0)
      };
    }, { ticked: 0, available: 0 });
    return {
      ticked: typeof attempt.markPointsTicked === 'number' ? attempt.markPointsTicked : fromParts.ticked,
      available: typeof attempt.markPointsAvailable === 'number' ? attempt.markPointsAvailable : fromParts.available
    };
  }

  function isPerfectSelfMarkedAttempt(attempt) {
    return Boolean(
      attempt
      && attempt.selfMarked !== false
      && typeof attempt.marksAvailable === 'number'
      && attempt.marksAvailable > 0
      && attempt.marksEarned === attempt.marksAvailable
    );
  }

  function examAttemptSuspicionFlags(attempt, previousAttempts) {
    var flags = new Set();
    var ratio = scoreRatioForAttempt(attempt);
    var markPoints = markPointCountsForAttempt(attempt);
    if (isPerfectSelfMarkedAttempt(attempt) && markPoints.available > 0 && markPoints.ticked === 0) {
      flags.add('full_marks_without_mark_points');
    }
    if (attempt.timingReliable === true && typeof ratio === 'number' && ratio >= 0.9 && attempt.timeSpentSeconds > 0 && attempt.timeSpentSeconds < 90) {
      flags.add('very_high_score_low_time');
    }
    if (isPerfectSelfMarkedAttempt(attempt) && safeArray(previousAttempts).filter(isPerfectSelfMarkedAttempt).length >= 2) {
      flags.add('repeated_perfect_self_marking');
    }
    if (attempt.answerRevealedBeforeMarking) {
      flags.add('answer_revealed_before_marking');
    }
    if (
      (attempt.confidenceRating === 'low' && typeof ratio === 'number' && ratio >= 0.85)
      || (attempt.confidenceRating === 'high' && typeof ratio === 'number' && ratio <= 0.4)
    ) {
      flags.add('confidence_score_mismatch');
    }
    return Array.from(flags);
  }

  function examTrustLabel(flags) {
    if (flags.includes('answer_revealed_before_marking') || flags.includes('repeated_perfect_self_marking')) {
      return 'Needs teacher check';
    }
    return flags.length ? 'Low-trust self-marked evidence' : 'Exam practice evidence';
  }

  function skillCheckGatePassed(progress, regionId) {
    if (!regionId) return false;
    var node = document.querySelector('[data-progress-skill="' + regionId + '"]');
    var requiredCheckIds = node ? parseRequiredCheckIds(node) : [];
    if (!requiredCheckIds.length) return false;
    return passedCheckIds(progress, requiredCheckIds, regionId).length >= requiredCheckIds.length;
  }

  function parseExamReviewRequirements(node) {
    try {
      var parsed = JSON.parse(node.getAttribute('data-required-topics') || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (item) {
        return item
          && typeof item.regionId === 'string'
          && typeof item.name === 'string'
          && typeof item.fieldGuideTotal === 'number'
          && Array.isArray(item.requiredCheckIds);
      });
    } catch (_error) {
      return [];
    }
  }

  function examReviewRequirementStatus(progress, requirement) {
    var fieldGuideTotal = Math.max(1, Number(requirement.fieldGuideTotal || 1));
    var guideCount = fieldGuideCompletedCount(progress, requirement.regionId, fieldGuideTotal);
    var requiredCheckIds = requirement.requiredCheckIds.filter(function (id) { return typeof id === 'string' && id; });
    var passCount = passedCheckIds(progress, requiredCheckIds, requirement.regionId).length;
    return {
      guideCount: guideCount,
      fieldGuideTotal: fieldGuideTotal,
      passCount: passCount,
      requiredCheckCount: requiredCheckIds.length,
      complete: guideCount >= fieldGuideTotal && passCount >= requiredCheckIds.length
    };
  }

  function updateExamReviewGate(progress) {
    document.querySelectorAll('[data-p3-exam-review-gate]').forEach(function (gate) {
      var requirements = parseExamReviewRequirements(gate);
      var statuses = requirements.map(function (requirement) {
        return Object.assign({ requirement: requirement }, examReviewRequirementStatus(progress, requirement));
      });
      var completed = statuses.filter(function (status) { return status.complete; }).length;
      var isOpen = requirements.length > 0 && completed === requirements.length;
      var lockedPanel = gate.querySelector('[data-exam-review-locked]');
      var openPanel = gate.querySelector('[data-exam-review-open]');
      var statusText = gate.querySelector('[data-exam-review-status]');
      var list = gate.querySelector('[data-exam-review-topic-list]');
      if (lockedPanel) lockedPanel.hidden = isOpen;
      if (openPanel) openPanel.hidden = !isOpen;
      if (statusText) {
        statusText.textContent = isOpen
          ? 'All P3 units are complete in this browser. Mixed exam review is open.'
          : completed + '/' + requirements.length + ' units complete. Finish the remaining Learn Mode steps and checked questions first.';
      }
      if (list) {
        list.innerHTML = statuses.map(function (status) {
          var requirement = status.requirement;
          var targetHref = status.guideCount < status.fieldGuideTotal
            ? requirement.fieldGuideHref
            : requirement.skillCheckHref;
          return '<li class="' + (status.complete ? 'is-complete' : 'is-incomplete') + '">'
            + '<div><strong>' + escapeText(requirement.name) + '</strong>'
            + '<span>Learn Mode ' + status.guideCount + '/' + status.fieldGuideTotal
            + '; checked questions ' + status.passCount + '/' + status.requiredCheckCount + '</span></div>'
            + (status.complete ? '<span class="unit-state">Done</span>' : '<a class="text-link" href="' + escapeText(targetHref || '#') + '">Continue</a>')
            + '</li>';
        }).join('');
      }
    });
  }

  function updateProgressText() {
    var progress = loadProgress();
    document.querySelectorAll('[data-progress-field-guide]').forEach(function (node) {
      var regionId = node.getAttribute('data-progress-field-guide') || '';
      var total = Number(node.getAttribute('data-total') || 1);
      var label = node.getAttribute('data-label') || 'Field Guide';
      var completed = fieldGuideCompletedCount(progress, regionId, total);
      node.textContent = label + ': ' + completed + '/' + total;
      node.classList.toggle('is-complete', completed >= total);
    });

    document.querySelectorAll('[data-progress-skill]').forEach(function (node) {
      var regionId = node.getAttribute('data-progress-skill') || '';
      var label = node.getAttribute('data-label') || 'Skill Check';
      var requiredCheckIds = parseRequiredCheckIds(node);
      var passCount = requiredCheckIds.length
        ? passedCheckIds(progress, requiredCheckIds, regionId).length
        : passingSkillAttemptsForRegion(progress, regionId).length;
      node.textContent = requiredCheckIds.length
        ? label + ': ' + passCount + '/' + requiredCheckIds.length + ' passed'
        : label + ': ' + passCount + ' passed';
      node.classList.toggle('is-complete', requiredCheckIds.length > 0 && passCount >= requiredCheckIds.length);
    });

    document.querySelectorAll('[data-progress-exam]').forEach(function (node) {
      var regionId = node.getAttribute('data-progress-exam') || '';
      var label = node.getAttribute('data-label') || 'Exam practice evidence';
      var count = attemptsForRegion(progress, regionId).length;
      node.textContent = label + ': ' + count + ' self-marked';
      node.classList.remove('is-complete');
      node.classList.toggle('has-evidence', count > 0);
    });

    document.querySelectorAll('[data-total-attempts]').forEach(function (node) {
      var family = node.getAttribute('data-paper-family') || 'p3';
      var label = node.getAttribute('data-paper-label') || paperFamilyLabel(family);
      var count = attemptsForPaperFamily(progress, family).length;
      node.textContent = count + ' saved ' + label + ' self-marked attempt' + (count === 1 ? '' : 's');
    });

    document.querySelectorAll('[data-topic-tried-count]').forEach(function (node) {
      var family = node.getAttribute('data-paper-family') || 'p3';
      var tried = new Set(attemptsForPaperFamily(progress, family).map(function (attempt) {
        return attempt.validatedRegionId || attempt.displayRegionId || attempt.topicDisplayName;
      }).filter(Boolean));
      node.textContent = tried.size + ' topic area' + (tried.size === 1 ? '' : 's') + ' tried';
    });

    document.querySelectorAll('[data-progress-status]').forEach(function (node) {
      var regionId = node.getAttribute('data-progress-status') || '';
      var fieldTotal = Number(document.querySelector('[data-progress-field-guide="' + regionId + '"]')?.getAttribute('data-total') || 1);
      var guideCount = fieldGuideCompletedCount(progress, regionId, fieldTotal);
      var practiceCount = passingSkillAttemptsForRegion(progress, regionId).length;
      var examCount = attemptsForRegion(progress, regionId).length;
      node.textContent = 'Local progress: ' + guideCount + '/' + fieldTotal + ' Learn Mode steps, ' + practiceCount + ' checked question passes, ' + examCount + ' self-marked exam evidence.';
    });

    document.querySelectorAll('[data-progress-summary]').forEach(function (node) {
      var regionId = node.getAttribute('data-progress-summary') || '';
      var fieldTotal = Number(node.getAttribute('data-field-total') || 1);
      var guideCount = fieldGuideCompletedCount(progress, regionId, fieldTotal);
      var practiceCount = passingSkillAttemptsForRegion(progress, regionId).length;
      var examCount = attemptsForRegion(progress, regionId).length;
      var parts = [];
      if (guideCount > 0) parts.push(guideCount + '/' + fieldTotal + ' Learn Mode');
      if (practiceCount > 0) parts.push(practiceCount + ' checked pass' + (practiceCount === 1 ? '' : 'es'));
      if (examCount > 0) parts.push(examCount + ' self-marked exam attempt' + (examCount === 1 ? '' : 's'));
      node.textContent = parts.length ? parts.join(' · ') : 'No saved progress yet';
      node.style.setProperty('--progress-ratio', Math.round(Math.min(1, Math.max(0, guideCount / Math.max(1, fieldTotal))) * 100) + '%');
    });

    document.querySelectorAll('[data-complete-field-guide-topic]').forEach(function (button) {
      var regionId = button.getAttribute('data-region-id') || '';
      var topicId = button.getAttribute('data-complete-field-guide-topic') || '';
      var saved = Boolean(completionsFor(progress, regionId)[topicId]);
      button.classList.toggle('is-saved', saved);
      if (saved) button.textContent = 'Got it';
    });

    updateSkillCheckForms(progress);
    updateExamReviewGate(progress);
  }

  function completeFieldGuideTopic(regionId, topicId, title) {
    var progress = loadProgress();
    var now = new Date().toISOString();
    var current = progress.regionLearning[regionId] || { regionId: regionId };
    var completions = Object.assign({}, current.fieldGuideTopicCompletions || {});
    completions[topicId] = completions[topicId] || {
      topicId: topicId,
      subtopicId: topicId,
      title: title,
      completedAt: now,
      source: 'field_guide'
    };

    var topicButtons = Array.from(document.querySelectorAll('[data-complete-field-guide-topic][data-region-id="' + regionId + '"]'));
    var allComplete = topicButtons.length > 0 && topicButtons.every(function (button) {
      var id = button.getAttribute('data-complete-field-guide-topic') || '';
      return Boolean(completions[id]);
    });

    progress.regionLearning[regionId] = Object.assign({}, current, {
      regionId: regionId,
      fieldGuideStartedAt: current.fieldGuideStartedAt || now,
      fieldGuideCompletedAt: allComplete ? (current.fieldGuideCompletedAt || now) : current.fieldGuideCompletedAt,
      fieldGuideTopicCompletions: completions,
      updatedAt: now
    });
    saveProgress(progress);
    updateProgressText();
  }

  function completeWholeFieldGuide(regionId) {
    document.querySelectorAll('[data-complete-field-guide-topic][data-region-id="' + regionId + '"]').forEach(function (button) {
      completeFieldGuideTopic(regionId, button.getAttribute('data-complete-field-guide-topic') || '', button.getAttribute('data-topic-title') || '');
    });
    var progress = loadProgress();
    var now = new Date().toISOString();
    var current = progress.regionLearning[regionId] || { regionId: regionId };
    progress.regionLearning[regionId] = Object.assign({}, current, {
      regionId: regionId,
      fieldGuideStartedAt: current.fieldGuideStartedAt || now,
      fieldGuideCompletedAt: current.fieldGuideCompletedAt || now,
      updatedAt: now
    });
    saveProgress(progress);
    updateProgressText();
  }

  function completeLearnStepInProgress(progress, regionId, stepId, title, attemptId) {
    if (!regionId || !stepId) return progress;
    var now = new Date().toISOString();
    var current = progress.regionLearning[regionId] || { regionId: regionId };
    var completions = Object.assign({}, current.fieldGuideTopicCompletions || {});
    completions[stepId] = completions[stepId] || {
      topicId: stepId,
      subtopicId: stepId,
      title: title,
      completedAt: now,
      source: 'quick_check',
      activityId: stepId,
      attemptId: attemptId
    };

    var stepCards = Array.from(document.querySelectorAll('[data-learn-step-card][data-region-id="' + regionId + '"]'));
    var allComplete = stepCards.length > 0 && stepCards.every(function (card) {
      var id = card.getAttribute('data-field-guide-topic') || card.getAttribute('data-learn-step-id') || '';
      return Boolean(completions[id]);
    });

    progress.regionLearning[regionId] = Object.assign({}, current, {
      regionId: regionId,
      fieldGuideStartedAt: current.fieldGuideStartedAt || now,
      fieldGuideCompletedAt: allComplete ? (current.fieldGuideCompletedAt || now) : current.fieldGuideCompletedAt,
      fieldGuideTopicCompletions: completions,
      updatedAt: now
    });
    return progress;
  }

  function learnStepCompleted(progress, regionId, stepId) {
    return Boolean(completionsFor(progress, regionId)[stepId]);
  }

  function normalizeMathText(value) {
    return String(value || '')
      .trim()
      .replace(/^\$+|\$+$/g, '')
      .replace(/^\\\(|\\\)$/g, '')
      .replace(/\\left|\\right/g, '')
      .replace(/\\mathrm\s*\{\s*i\s*\}/g, 'i')
      .replace(/\\operatorname\s*\{\s*i\s*\}/g, 'i')
      .replace(/−/g, '-')
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/\\leq?|\\le/g, '<=')
      .replace(/\\geq?|\\ge/g, '>=')
      .replace(/\\lt/g, '<')
      .replace(/\\gt/g, '>')
      .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2')
      .replace(/\\cdot|\\times/g, '*')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ');
  }

  function compactAnswerText(value) {
    return normalizeMathText(value).replace(/\s+/g, '').toLowerCase();
  }

  function afterEquals(value) {
    var text = String(value || '');
    var index = text.lastIndexOf('=');
    return index >= 0 ? text.slice(index + 1) : text;
  }

  function parseSimpleNumber(value) {
    var compact = compactAnswerText(afterEquals(value)).replace(/^\+/, '');
    if (!compact) return undefined;
    if (/^[+-]?\d+(?:\.\d+)?$/.test(compact)) return Number(compact);
    var fraction = compact.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
    if (!fraction) return undefined;
    var numerator = Number(fraction[1]);
    var denominator = Number(fraction[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return undefined;
    return numerator / denominator;
  }

  function numericLabel(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
  }

  function numbersEqual(left, right, tolerance) {
    return Math.abs(left - right) <= tolerance;
  }

  function normalizeExactText(value) {
    return normalizeMathText(value).replace(/[.。]+$/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function normalizeExpressionText(value) {
    return compactAnswerText(value).replace(/\*/g, '').replace(/\^1(?!\d)/g, '');
  }

  function splitTopLevelValues(value) {
    return normalizeMathText(value)
      .replace(/\bor\b/gi, ',')
      .replace(/[;]/g, ',')
      .split(',')
      .map(function (part) { return part.trim(); })
      .filter(Boolean);
  }

  function normalizeMultiValueParts(value) {
    return splitTopLevelValues(value).map(function (part) {
      var numeric = parseSimpleNumber(part);
      return numeric === undefined ? normalizeExpressionText(part) : '#' + numericLabel(numeric);
    });
  }

  function multiValuesEqual(submittedParts, acceptedParts, tolerance, orderMatters) {
    if (submittedParts.length !== acceptedParts.length) return false;
    function entryMatches(left, right) {
      if (left.startsWith('#') && right.startsWith('#')) {
        return numbersEqual(Number(left.slice(1)), Number(right.slice(1)), tolerance);
      }
      return left === right;
    }
    if (orderMatters) {
      return submittedParts.every(function (part, index) { return entryMatches(part, acceptedParts[index]); });
    }
    var unmatched = acceptedParts.slice();
    for (var index = 0; index < submittedParts.length; index += 1) {
      var matchIndex = unmatched.findIndex(function (accepted) { return entryMatches(submittedParts[index], accepted); });
      if (matchIndex < 0) return false;
      unmatched.splice(matchIndex, 1);
    }
    return unmatched.length === 0;
  }

  function parseCoordinate(value) {
    var match = normalizeMathText(value).match(/^\(?\s*([^,()]+)\s*,\s*([^,()]+)(?:\s*,\s*([^,()]+))?\s*\)?$/);
    if (!match) return undefined;
    var parts = [match[1], match[2], match[3]].filter(Boolean);
    var parsed = parts.map(parseSimpleNumber);
    if (parsed.some(function (part) { return part === undefined; })) return undefined;
    return parsed;
  }

  function coordinatesEqual(left, right, tolerance) {
    return left.length === right.length && left.every(function (value, index) {
      return numbersEqual(value, right[index], tolerance);
    });
  }

  function normalizeCoordinate(value) {
    return '(' + value.map(numericLabel).join(', ') + ')';
  }

  function parseInterval(value) {
    var normalized = normalizeMathText(value).trim();
    var compact = normalized.replace(/\s+/g, '');
    var notation = compact.match(/^([\[(])([^,]+),([^\])]+)([\]\)])$/);
    if (notation) {
      var notationLower = parseSimpleNumber(notation[2]);
      var notationUpper = parseSimpleNumber(notation[3]);
      if (notationLower === undefined || notationUpper === undefined || notationLower > notationUpper) return undefined;
      return {
        lower: notationLower,
        upper: notationUpper,
        lowerInclusive: notation[1] === '[',
        upperInclusive: notation[4] === ']'
      };
    }
    var chain = compact.match(/^(.+?)(<=|<)([a-z])(?:<=|<)(.+)$/i);
    if (chain) {
      var secondOperator = compact.slice(compact.indexOf(chain[3]) + chain[3].length).match(/^(<=|<)/)?.[1];
      var chainLower = parseSimpleNumber(chain[1]);
      var chainUpper = parseSimpleNumber(chain[4]);
      if (!secondOperator || chainLower === undefined || chainUpper === undefined || chainLower > chainUpper) return undefined;
      return {
        lower: chainLower,
        upper: chainUpper,
        lowerInclusive: chain[2] === '<=',
        upperInclusive: secondOperator === '<='
      };
    }
    var conjunction = normalized.replace(/\s+/g, ' ').match(/^([a-z])\s*(>=|>)\s*(.+?)\s*(?:and|,)\s*\1\s*(<=|<)\s*(.+)$/i);
    if (conjunction) {
      var conjunctionLower = parseSimpleNumber(conjunction[3]);
      var conjunctionUpper = parseSimpleNumber(conjunction[5]);
      if (conjunctionLower === undefined || conjunctionUpper === undefined || conjunctionLower > conjunctionUpper) return undefined;
      return {
        lower: conjunctionLower,
        upper: conjunctionUpper,
        lowerInclusive: conjunction[2] === '>=',
        upperInclusive: conjunction[4] === '<='
      };
    }
    return undefined;
  }

  function intervalsEqual(left, right, tolerance) {
    return numbersEqual(left.lower, right.lower, tolerance)
      && numbersEqual(left.upper, right.upper, tolerance)
      && left.lowerInclusive === right.lowerInclusive
      && left.upperInclusive === right.upperInclusive;
  }

  function normalizeInterval(value) {
    return (value.lowerInclusive ? '[' : '(') + numericLabel(value.lower) + ', ' + numericLabel(value.upper) + (value.upperInclusive ? ']' : ')');
  }

  function parseImaginaryCoefficient(value) {
    if (value === '' || value === '+') return 1;
    if (value === '-') return -1;
    return parseSimpleNumber(value);
  }

  function parseComplex(value) {
    var compact = compactAnswerText(afterEquals(value)).replace(/\*/g, '').replace(/j/gi, 'i');
    if (!compact) return undefined;
    if (!compact.includes('i')) {
      var realOnly = parseSimpleNumber(compact);
      return realOnly === undefined ? undefined : { real: realOnly, imaginary: 0 };
    }
    var imaginaryFirst = compact.match(/^([+-]?\d*(?:\.\d+)?(?:\/[+-]?\d+(?:\.\d+)?)?)i([+-].+)$/);
    if (imaginaryFirst) {
      var firstImaginary = parseImaginaryCoefficient(imaginaryFirst[1]);
      var firstReal = parseSimpleNumber(imaginaryFirst[2]);
      if (firstReal === undefined || firstImaginary === undefined) return undefined;
      return { real: firstReal, imaginary: firstImaginary };
    }
    if (!compact.endsWith('i') || compact.indexOf('i') !== compact.length - 1) return undefined;
    var withoutI = compact.slice(0, -1);
    var splitIndex = -1;
    for (var index = 1; index < withoutI.length; index += 1) {
      var char = withoutI[index];
      if (char === '+' || char === '-') splitIndex = index;
    }
    if (splitIndex < 0) {
      var imaginaryOnly = parseImaginaryCoefficient(withoutI);
      return imaginaryOnly === undefined ? undefined : { real: 0, imaginary: imaginaryOnly };
    }
    var real = parseSimpleNumber(withoutI.slice(0, splitIndex));
    var imaginary = parseImaginaryCoefficient(withoutI.slice(splitIndex));
    if (real === undefined || imaginary === undefined) return undefined;
    return { real: real, imaginary: imaginary };
  }

  function complexEqual(left, right, tolerance) {
    return numbersEqual(left.real, right.real, tolerance) && numbersEqual(left.imaginary, right.imaginary, tolerance);
  }

  function normalizeComplex(value) {
    return numericLabel(value.real) + ' ' + (value.imaginary < 0 ? '-' : '+') + ' ' + numericLabel(Math.abs(value.imaginary)) + 'i';
  }

  function skillCheckResult(spec, values) {
    return Object.assign({ answerType: spec.answerType }, values);
  }

  function isSupportedSkillCheckAnswerType(answerType) {
    return [
      'exact-text',
      'numeric',
      'expression-text',
      'multi-value',
      'coordinate',
      'interval',
      'complex-number'
    ].includes(answerType);
  }

  function checkSubmittedSkillAnswer(spec, submittedAnswer) {
    var trimmed = String(submittedAnswer || '').trim();
    if (!isSupportedSkillCheckAnswerType(spec.answerType)) {
      return skillCheckResult(spec, { isCorrect: false, normalizedSubmittedAnswer: trimmed, reason: 'Unsupported answer type: ' + spec.answerType + '.', unsupported: true });
    }
    if (!trimmed) {
      return skillCheckResult(spec, { isCorrect: false, normalizedSubmittedAnswer: '', reason: 'Submitted answer is empty.', unsupported: false });
    }
    if (!spec.acceptedAnswers.length) {
      return skillCheckResult(spec, { isCorrect: false, normalizedSubmittedAnswer: trimmed, reason: 'No accepted answers are configured.', unsupported: true });
    }
    var tolerance = Number.isFinite(spec.tolerance) ? spec.tolerance : 1e-10;
    var match;
    if (spec.answerType === 'exact-text') {
      var exact = normalizeExactText(trimmed);
      match = spec.acceptedAnswers.find(function (accepted) { return normalizeExactText(accepted) === exact; });
      return skillCheckResult(spec, { isCorrect: Boolean(match), normalizedSubmittedAnswer: exact, matchedAcceptedAnswer: match, reason: match ? 'Matched normalized exact text.' : 'Submitted text did not match any accepted answer.', unsupported: false });
    }
    if (spec.answerType === 'expression-text') {
      var expression = normalizeExpressionText(trimmed);
      match = spec.acceptedAnswers.find(function (accepted) { return normalizeExpressionText(accepted) === expression; });
      return skillCheckResult(spec, { isCorrect: Boolean(match), normalizedSubmittedAnswer: expression, matchedAcceptedAnswer: match, reason: match ? 'Matched normalized expression text.' : 'Expression did not match an accepted normalized text form. Algebraic equivalence is not inferred.', unsupported: false });
    }
    if (spec.answerType === 'numeric') {
      var submittedNumber = parseSimpleNumber(trimmed);
      if (submittedNumber === undefined) return skillCheckResult(spec, { isCorrect: false, normalizedSubmittedAnswer: compactAnswerText(trimmed), reason: 'Submitted answer is not a supported integer, decimal, or simple fraction.', unsupported: false });
      match = spec.acceptedAnswers.find(function (accepted) {
        var acceptedNumber = parseSimpleNumber(accepted);
        return acceptedNumber !== undefined && numbersEqual(submittedNumber, acceptedNumber, tolerance);
      });
      return skillCheckResult(spec, { isCorrect: Boolean(match), normalizedSubmittedAnswer: numericLabel(submittedNumber), matchedAcceptedAnswer: match, reason: match ? 'Matched numeric answer within tolerance.' : 'Numeric answer did not match any accepted value within tolerance.', unsupported: false });
    }
    if (spec.answerType === 'multi-value') {
      var submittedParts = normalizeMultiValueParts(trimmed);
      match = spec.acceptedAnswers.find(function (accepted) {
        return multiValuesEqual(submittedParts, normalizeMultiValueParts(accepted), tolerance, spec.orderMatters === true);
      });
      return skillCheckResult(spec, { isCorrect: Boolean(match), normalizedSubmittedAnswer: submittedParts.join(', '), matchedAcceptedAnswer: match, reason: match ? 'Matched multi-value answer.' : 'Multi-value answer did not match any accepted value set.', unsupported: false });
    }
    if (spec.answerType === 'coordinate') {
      var coordinate = parseCoordinate(trimmed);
      if (!coordinate) return skillCheckResult(spec, { isCorrect: false, normalizedSubmittedAnswer: compactAnswerText(trimmed), reason: 'Submitted coordinate is not a supported numeric tuple.', unsupported: false });
      match = spec.acceptedAnswers.find(function (accepted) {
        var acceptedCoordinate = parseCoordinate(accepted);
        return acceptedCoordinate && coordinatesEqual(coordinate, acceptedCoordinate, tolerance);
      });
      return skillCheckResult(spec, { isCorrect: Boolean(match), normalizedSubmittedAnswer: normalizeCoordinate(coordinate), matchedAcceptedAnswer: match, reason: match ? 'Matched coordinate values within tolerance.' : 'Coordinate did not match any accepted tuple.', unsupported: false });
    }
    if (spec.answerType === 'interval') {
      var interval = parseInterval(trimmed);
      if (!interval) return skillCheckResult(spec, { isCorrect: false, normalizedSubmittedAnswer: compactAnswerText(trimmed), reason: 'Submitted interval is not a supported bounded interval form.', unsupported: false });
      match = spec.acceptedAnswers.find(function (accepted) {
        var acceptedInterval = parseInterval(accepted);
        return acceptedInterval && intervalsEqual(interval, acceptedInterval, tolerance);
      });
      return skillCheckResult(spec, { isCorrect: Boolean(match), normalizedSubmittedAnswer: normalizeInterval(interval), matchedAcceptedAnswer: match, reason: match ? 'Matched interval bounds and endpoint inclusivity.' : 'Interval did not match any accepted bounded interval.', unsupported: false });
    }
    if (spec.answerType === 'complex-number') {
      var complex = parseComplex(trimmed);
      if (!complex) return skillCheckResult(spec, { isCorrect: false, normalizedSubmittedAnswer: compactAnswerText(trimmed), reason: 'Submitted complex number is not a supported a + bi form.', unsupported: false });
      match = spec.acceptedAnswers.find(function (accepted) {
        var acceptedComplex = parseComplex(accepted);
        return acceptedComplex && complexEqual(complex, acceptedComplex, tolerance);
      });
      return skillCheckResult(spec, { isCorrect: Boolean(match), normalizedSubmittedAnswer: normalizeComplex(complex), matchedAcceptedAnswer: match, reason: match ? 'Matched complex number components within tolerance.' : 'Complex number did not match any accepted value.', unsupported: false });
    }
    return skillCheckResult(spec, { isCorrect: false, normalizedSubmittedAnswer: trimmed, reason: 'Unsupported answer type: ' + spec.answerType + '.', unsupported: true });
  }

  // Parity tests use this hook to compare the student-facing static checker with the TypeScript checker.
  window.__ASTERION_SKILL_CHECK_TEST_HOOKS__ = {
    checkSubmittedSkillAnswer: checkSubmittedSkillAnswer
  };

  function parseJsonAttribute(node, name, fallback) {
    try {
      var parsed = JSON.parse(node.getAttribute(name) || '');
      return parsed ?? fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function selectedMistakeTags(form) {
    return Array.from(form.querySelectorAll('input[name="mistakeTags"]:checked'))
      .map(function (input) { return input instanceof HTMLInputElement ? input.value : ''; })
      .filter(Boolean);
  }

  function targetedPromptForTags(tags) {
    for (var index = 0; index < tags.length; index += 1) {
      var prompt = TARGETED_MISTAKE_PROMPTS[tags[index]];
      if (prompt) return prompt;
    }
    return '';
  }

  function updateTargetedPrompt(form) {
    var prompt = form.querySelector('[data-targeted-prompt]');
    if (!prompt) return;
    var text = targetedPromptForTags(selectedMistakeTags(form));
    prompt.textContent = text;
    prompt.hidden = !text;
  }

  function updateLatestSkillCheckAttemptMistakeTags(form) {
    var progress = loadProgress();
    var checkId = form.getAttribute('data-check-id') || '';
    var latestIndex = progress.skillCheckAttempts.map(function (attempt) {
      return attempt.checkId;
    }).lastIndexOf(checkId);
    if (latestIndex < 0) return;
    progress.skillCheckAttempts[latestIndex] = Object.assign({}, progress.skillCheckAttempts[latestIndex], {
      mistakeTags: selectedMistakeTags(form)
    });
    saveProgress(progress);
  }

  function reviewCandidateState(attempt) {
    if (attempt.revealedAnswer) return 'revealed';
    if (attempt.revealedRepairStep) return 'repaired';
    if (!attempt.isCorrect) return 'incorrect';
    return '';
  }

  function validReviewMistakeTags(attempt) {
    return Array.isArray(attempt.mistakeTags)
      ? attempt.mistakeTags.filter(function (tag) { return Boolean(TARGETED_MISTAKE_PROMPTS[tag]); })
      : [];
  }

  function buildReviewGroups(attempts) {
    var groups = new Map();
    safeArray(attempts)
      .filter(function (attempt) {
        return attempt && attempt.course === 'p3' && typeof attempt.checkId === 'string' && typeof attempt.timestamp === 'string';
      })
      .sort(function (a, b) {
        return String(b.timestamp).localeCompare(String(a.timestamp));
      })
      .slice(0, 30)
      .forEach(function (attempt) {
        var state = reviewCandidateState(attempt);
        var tags = validReviewMistakeTags(attempt);
        if (!state || !tags.length) return;
        var candidate = {
          topic: attempt.topic || 'P3 Skill Check',
          skillId: attempt.skillId || '',
          checkId: attempt.checkId || '',
          submittedAnswer: attempt.submittedAnswer || '',
          timestamp: attempt.timestamp || '',
          state: state
        };
        tags.forEach(function (tag) {
          var candidates = groups.get(tag) || [];
          if (candidates.length < 6) candidates.push(candidate);
          groups.set(tag, candidates);
        });
      });
    return Array.from(groups, function (entry) {
      return {
        mistakeTag: entry[0],
        candidates: entry[1],
        count: entry[1].length
      };
    }).sort(function (a, b) {
      return b.count - a.count || a.mistakeTag.localeCompare(b.mistakeTag);
    });
  }

  function escapeText(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function renderReviewPage() {
    var groupContainer = document.querySelector('[data-review-groups]');
    var reviewSection = document.querySelector('[data-review-session]');
    var emptyState = document.querySelector('[data-review-empty]');
    if (!groupContainer || !reviewSection || !emptyState) return;
    var groups = buildReviewGroups(loadProgress().skillCheckAttempts);
    if (!groups.length) {
      reviewSection.hidden = true;
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;
    reviewSection.hidden = false;
    var total = groups.reduce(function (sum, group) { return sum + group.count; }, 0);
    var summary = document.querySelector('[data-review-summary]');
    if (summary) {
      summary.textContent = total + ' recent tagged review candidate' + (total === 1 ? '' : 's') + ' from this browser.';
    }
    groupContainer.innerHTML = groups.map(function (group) {
      return '<article class="review-group-card">'
        + '<header><div><p class="eyebrow">' + group.count + ' recent</p><h3>' + escapeText(group.mistakeTag) + '</h3></div></header>'
        + '<p class="targeted-prompt">' + escapeText(TARGETED_MISTAKE_PROMPTS[group.mistakeTag] || 'Review what went wrong before trying again.') + '</p>'
        + '<ul class="review-candidate-list">'
        + group.candidates.map(function (candidate) {
          return '<li>'
            + '<strong>' + escapeText(candidate.topic) + '</strong>'
            + '<span>' + escapeText(candidate.skillId || candidate.checkId) + '</span>'
            + '<small>' + escapeText(candidate.state) + (candidate.submittedAnswer ? ' · submitted: ' + escapeText(candidate.submittedAnswer) : '') + '</small>'
            + '</li>';
        }).join('')
        + '</ul></article>';
    }).join('');
  }

  function skillCheckSpecFromForm(form) {
    var toleranceText = form.getAttribute('data-tolerance') || '';
    var tolerance = toleranceText === '' ? NaN : Number(toleranceText);
    return {
      answerType: form.getAttribute('data-answer-type') || '',
      acceptedAnswers: parseJsonAttribute(form, 'data-accepted-answers', []),
      tolerance: Number.isFinite(tolerance) ? tolerance : undefined,
      orderMatters: form.getAttribute('data-order-matters') === 'true'
    };
  }

  function saveSkillCheckLocalAttempt(form, submittedAnswer, checkResult) {
    var progress = loadProgress();
    var attempt = {
      attemptId: createId('skill_attempt'),
      course: 'p3',
      topic: form.getAttribute('data-topic') || '',
      skillId: form.getAttribute('data-skill-id') || '',
      checkId: form.getAttribute('data-check-id') || '',
      regionId: form.getAttribute('data-region-id') || '',
      submittedAnswer: submittedAnswer,
      isCorrect: Boolean(checkResult.isCorrect),
      usedHint: form.getAttribute('data-used-hint') === 'true',
      revealedAnswer: form.getAttribute('data-revealed-answer') === 'true',
      revealedRepairStep: form.getAttribute('data-revealed-repair-step') === 'true',
      mistakeTags: selectedMistakeTags(form),
      timestamp: new Date().toISOString()
    };
    progress.skillCheckAttempts.push(attempt);
    saveProgress(progress);
    updateProgressText();
    return attempt;
  }

  function saveLearnModeAttempt(form, submittedAnswer, checkResult) {
    var progress = loadProgress();
    var now = new Date().toISOString();
    var regionId = form.getAttribute('data-region-id') || '';
    var stepId = form.getAttribute('data-field-guide-topic-id') || form.getAttribute('data-step-id') || '';
    var usedHint = form.getAttribute('data-used-hint') === 'true';
    var revealedAnswer = form.getAttribute('data-revealed-answer') === 'true';
    var strongEvidence = Boolean(checkResult.isCorrect && !usedHint && !revealedAnswer);
    var attempt = {
      id: createId('learn_attempt'),
      regionId: regionId,
      activityType: 'learn_mode',
      activityId: form.getAttribute('data-check-id') || stepId,
      stepId: stepId,
      topic: form.getAttribute('data-topic') || '',
      prompt: form.getAttribute('data-step-title') || '',
      submittedAnswer: submittedAnswer,
      isCorrect: Boolean(checkResult.isCorrect),
      usedHint: usedHint,
      revealedAnswer: revealedAnswer,
      strongEvidence: strongEvidence,
      mistakeTags: selectedMistakeTags(form),
      createdAt: now,
      completedAt: checkResult.isCorrect ? now : undefined
    };
    progress.learningActivityAttempts.push(attempt);
    if (checkResult.isCorrect) {
      progress = completeLearnStepInProgress(progress, regionId, stepId, form.getAttribute('data-step-title') || '', attempt.id);
    }
    saveProgress(progress);
    updateProgressText();
    return attempt;
  }

  function cleanLearnAttemptCanSaveSkill(form, checkResult) {
    return Boolean(checkResult.isCorrect
      && form.getAttribute('data-learn-saves-skill-pass') === 'true'
      && form.getAttribute('data-used-hint') !== 'true'
      && form.getAttribute('data-revealed-answer') !== 'true');
  }

  function setSkillFeedback(form, message, state) {
    var feedback = form.querySelector('.skill-check-feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.setAttribute('data-state', state);
  }

  function updateSkillCheckFormState(form, progress) {
    var checkId = form.getAttribute('data-check-id') || '';
    var passingAttempt = progress.skillCheckAttempts.find(function (attempt) {
      return attempt.checkId === checkId && isPassingSkillCheckAttempt(attempt);
    });
    var next = form.querySelector('[data-skill-check-inline-next]');
    if (passingAttempt) {
      form.classList.add('is-passed');
      setSkillFeedback(form, 'Passed locally with a correct unrevealed answer.', 'passed');
      if (next) next.hidden = false;
      var submit = form.querySelector('button[type="submit"]');
      if (submit) submit.className = 'button secondary-button';
    }
  }

  function updateSkillCheckForms(progress) {
    document.querySelectorAll('[data-check-skill-answer]').forEach(function (form) {
      if (form instanceof HTMLFormElement) updateSkillCheckFormState(form, progress);
    });
  }

  function saveSkillReveal(form, revealKind) {
    form.setAttribute(revealKind === 'answer' ? 'data-revealed-answer' : 'data-revealed-repair-step', 'true');
    var submitted = String(new FormData(form).get('submittedAnswer') || '').trim();
    saveSkillCheckLocalAttempt(form, submitted, {
      isCorrect: false,
      normalizedSubmittedAnswer: submitted,
      reason: revealKind === 'answer' ? 'Answer revealed.' : 'Repair step revealed.'
    });
    setSkillFeedback(form, revealKind === 'answer'
      ? 'Answer revealed. This is saved as repaired practice, not passed.'
      : 'Repair step revealed. This is saved as repaired practice, not passed.', 'repaired');
  }

  function checkSkillAnswer(form) {
    var submittedAnswer = String(new FormData(form).get('submittedAnswer') || '').trim();
    var checkResult = checkSubmittedSkillAnswer(skillCheckSpecFromForm(form), submittedAnswer);
    saveSkillCheckLocalAttempt(form, submittedAnswer, checkResult);
    var submitButton = form.querySelector('button[type="submit"]');
    var nextButton = form.querySelector('[data-skill-check-inline-next]');
    var repair = form.querySelector('[data-skill-repair]');
    var answerReveal = form.querySelector('[data-skill-answer-reveal]');
    var mistakePanel = form.querySelector('[data-mistake-tag-panel]');
    if (checkResult.isCorrect && form.getAttribute('data-revealed-answer') !== 'true' && form.getAttribute('data-revealed-repair-step') !== 'true') {
      setSkillFeedback(form, 'Correct. Saved as a deterministic pass.', 'correct');
      form.classList.add('is-passed');
      if (nextButton) nextButton.hidden = false;
      if (submitButton) {
        submitButton.textContent = 'Check again';
        submitButton.className = 'button secondary-button';
      }
      return;
    }
    if (checkResult.isCorrect) {
      setSkillFeedback(form, 'Correct, but this was already revealed or repaired, so it is not marked passed.', 'repaired');
      if (nextButton) nextButton.hidden = false;
      return;
    }
    setSkillFeedback(form, 'Not yet. Saved as an incorrect attempt. Try again or open the repair step.', 'incorrect');
    if (submitButton) {
      submitButton.textContent = 'Try again';
      submitButton.className = 'button primary-button';
    }
    if (mistakePanel) mistakePanel.hidden = false;
    updateTargetedPrompt(form);
    if (repair) repair.hidden = false;
    if (answerReveal) answerReveal.hidden = false;
    if (nextButton) nextButton.hidden = true;
  }

  function checkLearnAnswer(form) {
    var submittedAnswer = String(new FormData(form).get('submittedAnswer') || '').trim();
    var checkResult = checkSubmittedSkillAnswer(skillCheckSpecFromForm(form), submittedAnswer);
    saveLearnModeAttempt(form, submittedAnswer, checkResult);
    if (cleanLearnAttemptCanSaveSkill(form, checkResult)) {
      saveSkillCheckLocalAttempt(form, submittedAnswer, checkResult);
    }

    var submitButton = form.querySelector('button[type="submit"]');
    var mistakePanel = form.querySelector('[data-mistake-tag-panel]');
    var hint = form.querySelector('[data-learn-hint]');
    var afterAttempt = form.querySelector('[data-learn-after-attempt]');
    var stepCard = form.closest('[data-learn-step-card]');
    var similar = stepCard?.querySelector('[data-learn-similar-panel]');
    var transfer = stepCard?.querySelector('[data-learn-exam-transfer]');

    if (afterAttempt) afterAttempt.hidden = false;
    if (similar) similar.hidden = false;
    if (transfer) transfer.hidden = false;

    if (checkResult.isCorrect) {
      var clean = cleanLearnAttemptCanSaveSkill(form, checkResult);
      setSkillFeedback(form, clean
        ? 'Correct. Saved as a clean checked answer.'
        : 'Correct. Saved as supported practice, not strong Skill Check evidence.', clean ? 'correct' : 'repaired');
      form.classList.add('is-passed');
      if (submitButton) {
        submitButton.textContent = 'Check again';
        submitButton.className = 'button secondary-button';
      }
      window.dispatchEvent(new CustomEvent('asterion:learn-progress'));
      updateLearnModeFlowState();
      return;
    }

    setSkillFeedback(form, 'Not yet. The hint is now available, and this attempt has been saved as practice.', 'incorrect');
    form.setAttribute('data-used-hint', 'true');
    if (hint) hint.hidden = false;
    if (mistakePanel) mistakePanel.hidden = false;
    updateTargetedPrompt(form);
    if (submitButton) {
      submitButton.textContent = 'Try again';
      submitButton.className = 'button primary-button';
    }
    window.dispatchEvent(new CustomEvent('asterion:learn-progress'));
    updateLearnModeFlowState();
  }

  function examPartScores(form) {
    return Array.from(form.querySelectorAll('[data-exam-part]')).map(function (part) {
      var marksAvailable = Number(part.getAttribute('data-marks-available') || 0);
      var markPointsAvailable = Number(part.getAttribute('data-mark-points-available') || 0);
      var marksInput = part.querySelector('[data-part-marks-earned]');
      var marksEarned = Number(marksInput?.value || 0);
      var tickedMarkPoints = Array.from(part.querySelectorAll('[data-mark-point]:checked')).map(function (input) {
        return input.value;
      }).filter(Boolean);
      var attempted = Boolean(part.querySelector('[data-part-attempted]')?.checked || marksEarned > 0 || tickedMarkPoints.length > 0);
      return {
        partId: part.getAttribute('data-part-id') || undefined,
        subpartId: part.getAttribute('data-subpart-id') || undefined,
        label: part.getAttribute('data-part-label') || 'Whole question',
        attempted: attempted,
        marksEarned: marksEarned,
        marksAvailable: marksAvailable,
        markPointIds: tickedMarkPoints,
        markPointsAvailable: markPointsAvailable
      };
    });
  }

  function validateExamPartScores(partScores) {
    if (!partScores.length) return 'No self-marking parts are available for this question.';
    if (!partScores.some(function (part) { return part.attempted; })) return 'Mark at least one part as attempted before saving.';
    for (var index = 0; index < partScores.length; index += 1) {
      var part = partScores[index];
      if (!Number.isFinite(part.marksEarned) || part.marksEarned < 0 || part.marksEarned > part.marksAvailable) {
        return 'Check the self-awarded marks for ' + part.label + '.';
      }
    }
    return '';
  }

  function applyExamAttemptIntegrity(attempt, progress) {
    var previousAttempts = attemptsForRegion(progress, attempt.validatedRegionId || attempt.displayRegionId || '');
    var flags = examAttemptSuspicionFlags(attempt, previousAttempts);
    var gatePassed = skillCheckGatePassed(progress, attempt.validatedRegionId || attempt.displayRegionId || '');
    attempt.suspicionFlags = flags;
    attempt.trustLabel = examTrustLabel(flags);
    attempt.evidenceKind = 'weak_self_marked_exam';
    attempt.evidenceLabel = 'Self-marked attempt';
    attempt.masteryEligible = false;
    attempt.masteryGate = gatePassed ? 'skill_check_passed' : 'skill_check_required';
    return attempt;
  }

  function saveExamAttempt(form) {
    var progress = loadProgress();
    var now = new Date().toISOString();
    var marksAvailable = Number(form.getAttribute('data-marks-available') || 0);
    var formData = new FormData(form);
    var partScores = examPartScores(form);
    var validationMessage = validateExamPartScores(partScores);
    var marksEarned = partScores.reduce(function (sum, part) { return sum + part.marksEarned; }, 0);
    var markPointsTicked = partScores.reduce(function (sum, part) { return sum + safeArray(part.markPointIds).length; }, 0);
    var markPointsAvailable = partScores.reduce(function (sum, part) { return sum + Number(part.markPointsAvailable || 0); }, 0);
    var mistakeType = String(formData.get('mistakeType') || '');
    var confidenceRating = String(formData.get('confidenceRating') || '');
    var status = form.querySelector('.form-status');
    var card = form.closest('.exam-question-card');
    var markSchemeRevealed = Boolean(card?.querySelector('[data-mark-scheme-reveal]')?.open);
    if (validationMessage || !markSchemeRevealed || !mistakeType || !['low', 'medium', 'high'].includes(confidenceRating)) {
      if (status) {
        status.textContent = validationMessage || (!markSchemeRevealed ? 'Reveal the mark scheme before saving a self-marked attempt.' : 'Add a reflection and confidence before saving.');
        status.setAttribute('data-state', 'warning');
      }
      return;
    }

    var startedAt = Number(form.getAttribute('data-started-at') || 0);
    var elapsedSeconds = startedAt > 0 ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0;
    var attempt = applyExamAttemptIntegrity({
      id: createId('attempt'),
      profileId: PROFILE_ID,
      questionId: form.getAttribute('data-question-id') || '',
      paperFamily: form.getAttribute('data-paper-family') || 'p3',
      paper: form.getAttribute('data-paper') || undefined,
      questionNumber: form.getAttribute('data-question-number') || undefined,
      topicDisplayName: form.getAttribute('data-topic') || 'Exam question',
      subtopic: form.getAttribute('data-subtopic') || undefined,
      marksEarned: marksEarned,
      marksAvailable: marksAvailable,
      scoreRatio: marksAvailable > 0 ? marksEarned / marksAvailable : undefined,
      partScores: partScores,
      mistakeType: mistakeType,
      mistakeTypes: mistakeType === 'no_issue' ? [] : [mistakeType],
      fullScoreConfirmed: marksAvailable > 0 && marksEarned === marksAvailable,
      selfMarked: true,
      confidentMode: document.documentElement.classList.contains('confident-student-mode'),
      confidenceRating: confidenceRating,
      answerRevealedBeforeMarking: form.getAttribute('data-answer-revealed-before-marking') === 'true',
      markPointsTicked: markPointsTicked,
      markPointsAvailable: markPointsAvailable,
      coarseSelfMarking: form.getAttribute('data-coarse-self-marking') === 'true',
      timingReliable: elapsedSeconds > 0,
      timeSpentSeconds: elapsedSeconds,
      markSchemeRevealed: markSchemeRevealed,
      attemptedAt: now,
      validatedRegionId: form.getAttribute('data-validated-region-id') || undefined,
      displayRegionId: form.getAttribute('data-display-region-id') || undefined,
      worldName: 'CAIE 9709 ' + paperFamilyLabel(form.getAttribute('data-paper-family') || 'p3')
    }, progress);

    progress.attempts.push(attempt);

    saveProgress(progress);
    if (status) {
      var gateText = attempt.masteryGate === 'skill_check_passed'
        ? 'Skill Check gate passed; exam work supports confidence only.'
        : 'Skill Check required for mastery.';
      status.textContent = attempt.trustLabel + '. Self-marked attempt saved. ' + gateText;
      status.setAttribute('data-state', attempt.suspicionFlags.length ? 'warning' : 'saved');
    }
    updateProgressText();
  }

  function applyConfidentStudentMode(enabled) {
    document.documentElement.classList.toggle('confident-student-mode', enabled);
    document.querySelectorAll('[data-save-exam-attempt]').forEach(function (form) {
      if (form instanceof HTMLFormElement) form.setAttribute('data-confident-mode', enabled ? 'true' : 'false');
    });
    document.querySelectorAll('[data-confident-student-mode]').forEach(function (input) {
      if (input instanceof HTMLInputElement) input.checked = enabled;
    });
  }

  function setupConfidentStudentMode() {
    applyConfidentStudentMode(loadProgress().settings?.confidentStudentMode === true);
    document.querySelectorAll('[data-confident-student-mode]').forEach(function (input) {
      if (!(input instanceof HTMLInputElement)) return;
      input.addEventListener('change', function () {
        var progress = loadProgress();
        progress.settings = Object.assign({}, progress.settings || {}, {
          confidentStudentMode: input.checked
        });
        saveProgress(progress);
        applyConfidentStudentMode(input.checked);
      });
    });
  }

  function setupExamSelfMarking() {
    document.querySelectorAll('[data-save-exam-attempt]').forEach(function (form) {
      if (!(form instanceof HTMLFormElement)) return;
      if (!form.getAttribute('data-started-at')) form.setAttribute('data-started-at', String(Date.now()));
      form.querySelectorAll('[data-part-attempted], [data-part-marks-earned], [data-mark-point]').forEach(function (input) {
        input.addEventListener('change', function () {
          form.setAttribute('data-started-marking', 'true');
        });
      });
    });
  }

  function setupPracticeStacks() {
    document.querySelectorAll('.practice-card-stack').forEach(function (stack) {
      if (stack.closest('[data-one-card-flow]')) return;
      var cards = Array.from(stack.children).filter(function (child) {
        return child instanceof HTMLElement && child.classList.contains('practice-card');
      });
      if (cards.length <= 1 || stack.previousElementSibling?.classList.contains('practice-controls')) return;

      var index = 0;
      var controls = document.createElement('div');
      controls.className = 'practice-controls';
      controls.setAttribute('aria-label', 'Question navigation');

      var label = document.createElement('span');
      label.className = 'practice-count';
      label.setAttribute('aria-live', 'polite');

      var previous = document.createElement('button');
      previous.className = 'button secondary-button';
      previous.type = 'button';
      previous.textContent = 'Previous question';

      var next = document.createElement('button');
      next.className = 'button primary-button';
      next.type = 'button';
      next.textContent = 'Next question';

      controls.append(previous, label, next);
      stack.before(controls);
      stack.classList.add('is-single-question');

      function render() {
        cards.forEach(function (card, cardIndex) {
          card.hidden = cardIndex !== index;
        });
        label.textContent = 'Question ' + (index + 1) + ' of ' + cards.length;
        previous.disabled = index === 0;
        next.disabled = index === cards.length - 1;
      }

      previous.addEventListener('click', function () {
        index = Math.max(0, index - 1);
        render();
      });

      next.addEventListener('click', function () {
        index = Math.min(cards.length - 1, index + 1);
        render();
      });

      render();
    });
  }

  function setupOneCardFlow() {
    document.querySelectorAll('[data-one-card-flow]').forEach(function (flow) {
      var allCards = Array.from(flow.querySelectorAll('.practice-card')).filter(function (card) {
        return card instanceof HTMLElement;
      });
      if (allCards.length <= 1 || flow.previousElementSibling?.classList.contains('practice-controls')) return;

      var containers = Array.from(new Set(allCards.map(function (card) {
        return card.closest('.practice-topic, .practice-subsection');
      }).filter(Boolean)));
      var sectionContainers = Array.from(new Set(allCards.map(function (card) {
        return card.closest('.practice-topic');
      }).filter(Boolean)));
      var skillCheckGroups = Array.from(flow.querySelectorAll('[data-skill-check-group]')).filter(function (group) {
        return group instanceof HTMLElement;
      });
      var isCoordinateGeometrySkillCheck = flow.getAttribute('data-topic-id') === 'p1-coordinate-geometry';
      var labelText = flow.getAttribute('data-flow-label') || 'Question';
      var defaultLimit = Number(flow.getAttribute('data-default-card-limit') || '0');
      var finalHref = flow.getAttribute('data-flow-final-href') || '';
      var finalLabel = flow.getAttribute('data-flow-final-label') || 'Continue';
      var index = 0;
      var setIndex = 0;
      var activeContainer = null;
      var cards = [];
      var selectedCards = [];
      var groupNav = null;
      var groupSwitcher = null;
      var currentSkillName = null;
      var completion = null;
      var completionText = null;
      var completionAction = null;
      var inCompletion = false;
      var controls = document.createElement('div');
      controls.className = 'practice-controls';
      controls.setAttribute('aria-label', labelText + ' navigation');

      var previous = document.createElement('button');
      previous.className = 'button secondary-button';
      previous.type = 'button';
      previous.textContent = 'Previous';

      var label = document.createElement('span');
      label.className = 'practice-count';
      label.setAttribute('aria-live', 'polite');

      var next = document.createElement('button');
      next.className = 'button primary-button';
      next.type = 'button';
      next.textContent = 'Next';

      var previousSet = document.createElement('button');
      previousSet.className = 'button secondary-button';
      previousSet.type = 'button';
      previousSet.textContent = 'Previous set';

      var morePractice = document.createElement('button');
      morePractice.className = 'button secondary-button';
      morePractice.type = 'button';
      morePractice.textContent = 'More practice';

      controls.append(previousSet, previous, label, next, morePractice);
      if (skillCheckGroups.length > 1) {
        groupSwitcher = document.createElement('details');
        groupSwitcher.className = 'practice-group-switcher';
        var groupSummary = document.createElement('summary');
        groupSummary.className = 'practice-group-summary';
        currentSkillName = document.createElement('span');
        currentSkillName.className = 'practice-current-skill';
        currentSkillName.textContent = 'Current skill';
        var changeSkill = document.createElement('span');
        changeSkill.className = 'practice-change-skill';
        changeSkill.textContent = 'Change skill';
        groupSummary.append(currentSkillName, changeSkill);
        groupNav = document.createElement('nav');
        groupNav.className = 'practice-group-nav';
        groupNav.setAttribute('aria-label', labelText + ' groups');
        skillCheckGroups.forEach(function (group) {
          var link = document.createElement('a');
          var groupId = group.getAttribute('id') || '';
          var heading = group.querySelector('h2');
          link.className = 'button secondary-button';
          link.href = groupId ? '#' + encodeURIComponent(groupId) : '#';
          link.textContent = heading?.textContent?.trim() || 'Skill Check';
          groupNav.append(link);
        });
        groupSwitcher.append(groupSummary, groupNav);
        flow.before(groupSwitcher);
        completion = document.createElement('section');
        completion.className = 'skill-check-completion';
        completion.hidden = true;
        completion.innerHTML = '<h2>Done.</h2><p></p>';
        completionText = completion.querySelector('p');
        completionAction = document.createElement('button');
        completionAction.className = 'button primary-button';
        completionAction.type = 'button';
        completion.append(completionAction);
        flow.after(completion);
      }
      flow.before(controls);
      flow.classList.add('is-single-question');

      function cardsForCurrentHash() {
        var hash = window.location.hash ? window.location.hash.slice(1) : '';
        var target = hash ? document.getElementById(hash) : null;
        var selectedContainer = target?.closest?.('.practice-topic, .practice-subsection') || target;
        if (!(selectedContainer instanceof HTMLElement) || !flow.contains(selectedContainer)) {
          selectedContainer = skillCheckGroups[0] || sectionContainers[0] || containers[0];
        }
        activeContainer = selectedContainer instanceof HTMLElement ? selectedContainer : null;
        var matches = allCards.filter(function (card) {
          return selectedContainer ? selectedContainer.contains(card) : true;
        });
        return matches.length ? matches : allCards;
      }

      function activeSkillGroupElement() {
        return activeContainer?.closest?.('[data-skill-check-group]');
      }

      function activeSkillGroupIndex() {
        var activeSkillGroup = activeSkillGroupElement();
        return skillCheckGroups.findIndex(function (group) {
          return group === activeSkillGroup;
        });
      }

      function activeSkillLabel() {
        var activeSkillGroup = activeSkillGroupElement();
        var heading = activeSkillGroup?.querySelector?.('h2');
        return heading?.textContent?.trim() || 'this skill';
      }

      function hashTargetIsInFlow() {
        var hash = window.location.hash ? window.location.hash.slice(1) : '';
        if (!hash) return false;
        var target = document.getElementById(hash);
        return target instanceof HTMLElement && flow.contains(target);
      }

      function currentChunk(cardsForSection) {
        if (defaultLimit <= 0) return cardsForSection;
        var start = setIndex * defaultLimit;
        return cardsForSection.slice(start, start + defaultLimit);
      }

      function updateCompletion() {
        if (!completion || !completionText || !completionAction) return;
        var groupIndex = activeSkillGroupIndex();
        var hasNextGroup = groupIndex >= 0 && groupIndex < skillCheckGroups.length - 1;
        completionText.textContent = hasNextGroup
          ? 'That was the 3-question check for ' + activeSkillLabel() + '.'
          : 'That was the last 3-question check for this topic.';
        completionAction.textContent = hasNextGroup ? 'Next subtopic' : finalLabel;
      }

      function moveToNextSkillOrFinalAction() {
        var activeGroupIndex = activeSkillGroupIndex();
        if (activeGroupIndex >= 0 && activeGroupIndex < skillCheckGroups.length - 1) {
          var nextGroupId = skillCheckGroups[activeGroupIndex + 1].id;
          inCompletion = false;
          if (nextGroupId) {
            window.location.hash = nextGroupId;
          }
          return;
        }
        if (finalHref) {
          window.location.href = finalHref;
          return;
        }
        document.querySelector('.exam-question-section')?.scrollIntoView?.({ behavior: 'auto', block: 'start' });
      }

      function render() {
        if (inCompletion) {
          allCards.forEach(function (card) {
            card.hidden = true;
          });
          containers.forEach(function (container) {
            if (container instanceof HTMLElement) {
              container.hidden = true;
            }
          });
          controls.hidden = true;
          if (groupSwitcher) groupSwitcher.hidden = true;
          if (completion) {
            updateCompletion();
            completion.hidden = false;
          }
          return;
        }
        controls.hidden = false;
        if (groupSwitcher) groupSwitcher.hidden = false;
        if (completion) completion.hidden = true;
        selectedCards = cardsForCurrentHash();
        var setCount = defaultLimit > 0 ? Math.max(1, Math.ceil(selectedCards.length / defaultLimit)) : 1;
        setIndex = Math.min(setIndex, setCount - 1);
        cards = currentChunk(selectedCards);
        if (!cards.length) {
          setIndex = 0;
          cards = currentChunk(selectedCards);
        }
        index = Math.min(index, Math.max(0, cards.length - 1));
        var activeCard = cards[index];
        allCards.forEach(function (card) {
          card.hidden = card !== activeCard;
        });
        containers.forEach(function (container) {
          if (container instanceof HTMLElement) {
            container.hidden = !container.contains(activeCard);
          }
        });
        label.textContent = labelText + ' ' + (index + 1) + ' of ' + cards.length;
        var activeSkillGroup = activeSkillGroupElement();
        var isLastCardInChunk = index === cards.length - 1;
        previous.hidden = index === 0;
        previous.disabled = index === 0;
        if (skillCheckGroups.length > 1 && isLastCardInChunk) {
          next.disabled = false;
          next.className = isCoordinateGeometrySkillCheck ? 'button secondary-button' : 'button primary-button';
          next.textContent = isCoordinateGeometrySkillCheck ? 'Skip to finish check' : 'Finish check';
        } else {
          next.disabled = false;
          next.className = skillCheckGroups.length > 1 && isCoordinateGeometrySkillCheck ? 'button secondary-button' : 'button primary-button';
          next.textContent = skillCheckGroups.length > 1 && isCoordinateGeometrySkillCheck ? 'Skip to next question' : 'Next question';
        }
        if (!skillCheckGroups.length && isLastCardInChunk) {
          next.disabled = true;
        }
        if (activeCard instanceof HTMLElement) {
          var activeSkillForm = activeCard.querySelector('[data-check-skill-answer]');
          var activeSkillPassed = activeSkillForm?.classList?.contains('is-passed');
          if (activeSkillForm && !activeSkillPassed) {
            next.className = 'button secondary-button';
            next.textContent = 'Pass to continue';
            next.disabled = true;
          }
          Array.from(activeCard.querySelectorAll('[data-skill-check-inline-next]')).forEach(function (button) {
            if (!(button instanceof HTMLButtonElement)) return;
            if (isLastCardInChunk && skillCheckGroups.length > 1) {
              var groupIndex = activeSkillGroupIndex();
              button.textContent = groupIndex >= 0 && groupIndex < skillCheckGroups.length - 1 ? 'Next subtopic' : finalLabel;
            } else {
              button.textContent = 'Next question';
            }
            button.hidden = !activeSkillPassed || (!skillCheckGroups.length && isLastCardInChunk);
          });
        }
        previousSet.hidden = setCount <= 1;
        morePractice.hidden = setCount <= 1;
        previousSet.disabled = setIndex === 0;
        morePractice.disabled = setIndex === setCount - 1;
        if (skillCheckGroups.length > 1 && isCoordinateGeometrySkillCheck && setCount > 1) {
          var nextSetCard = selectedCards[(setIndex + 1) * defaultLimit];
          var nextSetLabel = nextSetCard?.querySelector?.('.eyebrow')?.textContent?.trim();
          morePractice.textContent = nextSetLabel && nextSetLabel !== 'Try this' ? 'Try: ' + nextSetLabel : 'More practice';
        } else {
          morePractice.textContent = 'More practice';
        }
        if (groupNav) {
          Array.from(groupNav.querySelectorAll('a[href^="#"]')).forEach(function (link) {
            var linkTarget = decodeURIComponent((link.getAttribute('href') || '').replace(/^#/, ''));
            var isActive = activeSkillGroup instanceof HTMLElement && linkTarget === activeSkillGroup.id;
            if (isActive) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
          });
        }
        if (currentSkillName) {
          currentSkillName.textContent = activeSkillLabel();
        }
      }

      previous.addEventListener('click', function () {
        index = Math.max(0, index - 1);
        render();
      });

      next.addEventListener('click', function () {
        if (index >= cards.length - 1 && skillCheckGroups.length > 1) {
          inCompletion = true;
          render();
          return;
        }
        index = Math.min(cards.length - 1, index + 1);
        render();
      });

      flow.addEventListener('click', function (event) {
        var target = event.target;
        if (!(target instanceof Element) || !target.closest('[data-skill-check-inline-next]')) return;
        if (index >= cards.length - 1 && skillCheckGroups.length > 1) {
          moveToNextSkillOrFinalAction();
          return;
        }
        index = Math.min(cards.length - 1, index + 1);
        render();
      });

      previousSet.addEventListener('click', function () {
        setIndex = Math.max(0, setIndex - 1);
        index = 0;
        render();
      });

      morePractice.addEventListener('click', function () {
        selectedCards = cardsForCurrentHash();
        var setCount = defaultLimit > 0 ? Math.max(1, Math.ceil(selectedCards.length / defaultLimit)) : 1;
        setIndex = Math.min(setCount - 1, setIndex + 1);
        index = 0;
        render();
      });

      if (completionAction) {
        completionAction.addEventListener('click', function () {
          moveToNextSkillOrFinalAction();
        });
      }

      window.addEventListener('hashchange', function () {
        if (!hashTargetIsInFlow()) return;
        inCompletion = false;
        index = 0;
        setIndex = 0;
        if (groupSwitcher) groupSwitcher.open = false;
        render();
      });

      render();
    });
  }

  function setupExamQuestionFlow() {
    document.querySelectorAll('[data-exam-flow]').forEach(function (grid) {
      var cards = Array.from(grid.querySelectorAll('.exam-question-card')).filter(function (card) {
        return card instanceof HTMLElement;
      });
      if (cards.length <= 1 || grid.previousElementSibling?.classList.contains('exam-controls')) return;

      var labelText = grid.getAttribute('data-flow-label') || 'Question';
      var index = 0;
      var controls = document.createElement('div');
      controls.className = 'practice-controls exam-controls';
      controls.setAttribute('aria-label', labelText + ' navigation');

      var previous = document.createElement('button');
      previous.className = 'button secondary-button';
      previous.type = 'button';
      previous.textContent = 'Previous question';

      var label = document.createElement('span');
      label.className = 'practice-count';
      label.setAttribute('aria-live', 'polite');

      var next = document.createElement('button');
      next.className = 'button primary-button';
      next.type = 'button';
      next.textContent = 'Next question';

      controls.append(previous, label, next);
      grid.before(controls);
      grid.classList.add('is-single-question');

      function render() {
        cards.forEach(function (card, cardIndex) {
          card.hidden = cardIndex !== index;
        });
        label.textContent = 'Question ' + (index + 1) + ' of ' + cards.length;
        previous.disabled = index === 0;
        next.disabled = index === cards.length - 1;
      }

      previous.addEventListener('click', function () {
        index = Math.max(0, index - 1);
        render();
      });

      next.addEventListener('click', function () {
        index = Math.min(cards.length - 1, index + 1);
        render();
      });

      render();
    });
  }

  function updateLearnModeFlowState() {
    var progress = loadProgress();
    document.querySelectorAll('[data-learn-step-card]').forEach(function (card) {
      if (!(card instanceof HTMLElement)) return;
      var regionId = card.getAttribute('data-region-id') || '';
      var stepId = card.getAttribute('data-field-guide-topic') || card.getAttribute('data-learn-step-id') || '';
      var completed = learnStepCompleted(progress, regionId, stepId);
      var state = card.querySelector('[data-learn-step-state]');
      card.classList.toggle('is-complete', completed);
      if (state) state.textContent = completed ? 'Completed' : 'Not completed';
    });
  }

  function setupLearnModeFlow() {
    document.querySelectorAll('[data-learn-flow]').forEach(function (flow) {
      var cards = Array.from(flow.querySelectorAll('[data-learn-step-card]')).filter(function (card) {
        return card instanceof HTMLElement;
      });
      if (!cards.length || flow.previousElementSibling?.classList.contains('learn-controls')) return;

      var finalHref = flow.getAttribute('data-flow-final-href') || '';
      var finalLabel = flow.getAttribute('data-flow-final-label') || 'Continue';
      var index = Math.max(0, cards.findIndex(function (card) {
        return window.location.hash.replace(/^#/, '') === card.getAttribute('data-learn-step-id');
      }));
      var controls = document.createElement('div');
      controls.className = 'practice-controls learn-controls';
      controls.setAttribute('aria-label', 'Learn Mode navigation');

      var previous = document.createElement('button');
      previous.className = 'button secondary-button';
      previous.type = 'button';
      previous.textContent = 'Previous';

      var label = document.createElement('span');
      label.className = 'practice-count';
      label.setAttribute('aria-live', 'polite');

      var next = document.createElement('button');
      next.className = 'button primary-button';
      next.type = 'button';
      next.textContent = 'Next step';

      controls.append(previous, label, next);
      flow.before(controls);

      function currentCardComplete() {
        var progress = loadProgress();
        var card = cards[index];
        var regionId = card.getAttribute('data-region-id') || '';
        var stepId = card.getAttribute('data-field-guide-topic') || card.getAttribute('data-learn-step-id') || '';
        return learnStepCompleted(progress, regionId, stepId);
      }

      function render() {
        cards.forEach(function (card, cardIndex) {
          card.hidden = cardIndex !== index;
        });
        label.textContent = 'Step ' + (index + 1) + ' of ' + cards.length;
        previous.disabled = index === 0;
        var complete = currentCardComplete();
        next.disabled = !complete;
        next.textContent = index === cards.length - 1 ? 'Finish lesson sequence' : 'Next step';
        updateLearnModeFlowState();
      }

      previous.addEventListener('click', function () {
        index = Math.max(0, index - 1);
        render();
      });

      next.addEventListener('click', function () {
        if (!currentCardComplete()) return;
        if (index >= cards.length - 1) {
          if (finalHref) window.location.href = finalHref;
          else next.textContent = 'Completed lesson sequence';
          return;
        }
        index += 1;
        var stepId = cards[index].getAttribute('data-learn-step-id') || '';
        if (stepId) window.history.replaceState(null, '', '#' + stepId);
        render();
      });

      window.addEventListener('hashchange', function () {
        var hash = window.location.hash.replace(/^#/, '');
        var targetIndex = cards.findIndex(function (card) {
          return card.getAttribute('data-learn-step-id') === hash;
        });
        if (targetIndex < 0) return;
        index = targetIndex;
        render();
      });

      window.addEventListener('asterion:learn-progress', render);
      render();
    });
  }

  function setupGuidedStudy() {
    document.querySelectorAll('[data-guided-study]').forEach(function (study) {
      var tabs = Array.from(study.querySelectorAll('[data-phase-tab]'));
      var panels = Array.from(study.querySelectorAll('[data-phase-panel]'));
      var previous = study.querySelector('[data-guided-prev]');
      var next = study.querySelector('[data-guided-next]');
      var progress = study.querySelector('[data-guided-progress]');
      var practiceHref = study.getAttribute('data-practice-href') || '';
      if (!tabs.length || !panels.length) return;

      function phaseFromHash() {
        var hash = window.location.hash.replace(/^#/, '');
        if (!hash) return '';
        return tabs.some(function (tab) { return tab.getAttribute('data-phase-tab') === hash; }) ? hash : '';
      }

      function activeIndex() {
        return Math.max(0, tabs.findIndex(function (tab) {
          return tab.getAttribute('aria-selected') === 'true';
        }));
      }

      function setActive(index, updateHash) {
        var bounded = Math.max(0, Math.min(tabs.length - 1, index));
        tabs.forEach(function (tab, tabIndex) {
          var isActive = tabIndex === bounded;
          tab.classList.toggle('is-active', isActive);
          tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
          if (isActive) tab.setAttribute('aria-current', 'step');
          else tab.removeAttribute('aria-current');
        });
        panels.forEach(function (panel, panelIndex) {
          var isActive = panelIndex === bounded;
          panel.classList.toggle('is-active', isActive);
          panel.hidden = !isActive;
        });
        if (previous) previous.disabled = bounded === 0;
        if (next) next.textContent = bounded === tabs.length - 1 ? 'Go to Skill Check' : 'Next subtopic';
        if (progress) progress.textContent = (bounded + 1) + ' of ' + tabs.length;
        if (updateHash) {
          var phaseId = tabs[bounded].getAttribute('data-phase-tab') || '';
          if (phaseId) window.history.replaceState(null, '', '#' + phaseId);
        }
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () {
          setActive(index, true);
        });
        tab.addEventListener('keydown', function (event) {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
          event.preventDefault();
          var direction = event.key === 'ArrowRight' ? 1 : -1;
          var targetIndex = (activeIndex() + direction + tabs.length) % tabs.length;
          tabs[targetIndex].focus();
          setActive(targetIndex, true);
        });
      });

      if (previous) {
        previous.addEventListener('click', function () {
          setActive(activeIndex() - 1, true);
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          var current = activeIndex();
          if (current >= tabs.length - 1) {
            if (practiceHref) {
              var phaseId = tabs[current]?.getAttribute('data-phase-tab') || '';
              window.location.href = practiceHref + (phaseId ? '#' + encodeURIComponent(phaseId) : '');
            }
            return;
          }
          setActive(current + 1, true);
        });
      }

      var hashPhase = phaseFromHash();
      var initialIndex = hashPhase
        ? tabs.findIndex(function (tab) { return tab.getAttribute('data-phase-tab') === hashPhase; })
        : 0;
      setActive(initialIndex, false);

      window.addEventListener('hashchange', function () {
        var phaseId = phaseFromHash();
        if (!phaseId) return;
        setActive(tabs.findIndex(function (tab) {
          return tab.getAttribute('data-phase-tab') === phaseId;
        }), false);
      });
    });
  }

  function compactDemoAnswer(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\\left|\\right/g, '')
      .replace(/\s+/g, '')
      .replace(/[{}]/g, '')
      .replace(/−/g, '-');
  }

  function hasBoth(value, first, second) {
    return value.includes(first) && value.includes(second);
  }

  function checkHomepageDemoStep(index, rawAnswer) {
    var answer = compactDemoAnswer(rawAnswer);
    if (!answer) {
      return { correct: false, message: 'Write an attempt first. The point is to check your work, not skip the step.' };
    }

    if (index === 0) {
      var hasFactors = (hasBoth(answer, '(x+1)', '(x-1)') || hasBoth(answer, '(x-1)', '(x+1)'))
        && (answer.includes('(x+1)(x-1)') || answer.includes('(x-1)(x+1)') || answer.includes('x+1') && answer.includes('x-1'));
      return hasFactors
        ? { correct: true, message: 'Correct. The denominator is a difference of squares, so the two linear factors are x - 1 and x + 1.' }
        : { correct: false, message: 'Not yet. Look for a difference of squares: x^2 - 1 is x^2 - 1^2. Repair that factorization first.' };
    }

    if (index === 1) {
      var hasA = /a\/\(?(x-1)\)?/.test(answer) || /a\/\(?(x\+1)\)?/.test(answer);
      var hasB = /b\/\(?(x\+1)\)?/.test(answer) || /b\/\(?(x-1)\)?/.test(answer);
      var mentionsBothDenominators = answer.includes('x-1') && answer.includes('x+1');
      return hasA && hasB && mentionsBothDenominators
        ? { correct: true, message: 'Correct. Use one constant over each distinct linear factor before solving for A and B.' }
        : { correct: false, message: 'Not yet. Do not combine logs or integrate here. Write a fraction with A over one factor and B over the other.' };
    }

    if (index === 2) {
      var hasPositiveHalf = answer.includes('a=1/2') || answer.includes('a=.5') || answer.includes('a=0.5') || answer.includes('1/2/(x-1)');
      var hasNegativeHalf = answer.includes('b=-1/2') || answer.includes('b=-.5') || answer.includes('b=-0.5') || answer.includes('-1/2/(x+1)');
      var hasEquivalentSplit = answer.includes('1/(2(x-1))') && answer.includes('-1/(2(x+1))');
      return (hasPositiveHalf && hasNegativeHalf) || hasEquivalentSplit
        ? { correct: true, message: 'Correct. Substituting x = 1 gives A = 1/2, and x = -1 gives B = -1/2.' }
        : { correct: false, message: 'Check the signs. From 1 = A(x + 1) + B(x - 1), use x = 1 and x = -1 to isolate the constants.' };
    }

    if (index === 3) {
      var hasFirstLog = answer.includes('1/2ln|x-1|') || answer.includes('0.5ln|x-1|') || answer.includes('(1/2)ln|x-1|');
      var hasSecondLog = answer.includes('-1/2ln|x+1|') || answer.includes('-0.5ln|x+1|') || answer.includes('-(1/2)ln|x+1|');
      var hasLnTerms = answer.includes('ln') && answer.includes('x-1') && answer.includes('x+1') && answer.includes('-');
      return (hasFirstLog && hasSecondLog) || hasLnTerms
        ? { correct: true, message: 'Correct. Each 1/(linear factor) term integrates to a logarithm of the absolute value.' }
        : { correct: false, message: 'Not yet. Keep the 1/2 and -1/2 coefficients, then integrate each reciprocal linear term into a log.' };
    }

    if (index === 4) {
      var hasCombinedRatio = answer.includes('1/2ln|(x-1)/(x+1)|') || answer.includes('(1/2)ln|(x-1)/(x+1)|') || answer.includes('0.5ln|(x-1)/(x+1)|');
      var hasDifferenceWithC = answer.includes('ln') && answer.includes('x-1') && answer.includes('x+1') && answer.includes('-') && answer.includes('c');
      return hasCombinedRatio || hasDifferenceWithC
        ? { correct: true, message: 'Complete. The log difference combines to 1/2 ln |(x - 1)/(x + 1)| + C.' }
        : { correct: false, message: 'Almost. Combine the log difference as a quotient and include the constant of integration.' };
    }

    return { correct: false, message: 'This demo only checks the five shown steps.' };
  }

  function setupHomepageDemo() {
    document.querySelectorAll('[data-homepage-demo]').forEach(function (demo) {
      var steps = Array.from(demo.querySelectorAll('[data-demo-step]'));
      var progress = Array.from(demo.querySelectorAll('[data-demo-progress]'));
      var complete = demo.querySelector('[data-demo-complete]');

      function setStepState(step, state) {
        step.classList.remove('is-active', 'is-locked', 'is-correct', 'is-incorrect');
        step.classList.add('is-' + state);
        var textarea = step.querySelector('textarea');
        var button = step.querySelector('button');
        var status = step.querySelector('[data-demo-status]');
        var isEnabled = state === 'active' || state === 'incorrect';
        if (textarea) textarea.disabled = !isEnabled;
        if (button) button.disabled = !isEnabled;
        if (status) {
          status.className = 'homepage-demo-status is-' + (state === 'locked' ? 'waiting' : state);
          status.textContent = state === 'locked' ? 'Locked' : state === 'active' ? 'Ready' : state === 'correct' ? 'Correct' : 'Try again';
        }
      }

      function updateProgress(index, state) {
        var item = progress[index];
        if (!item) return;
        item.className = state === 'correct' ? 'is-correct' : state === 'active' ? 'is-active' : 'is-locked';
      }

      steps.forEach(function (step, index) {
        setStepState(step, index === 0 ? 'active' : 'locked');
        updateProgress(index, index === 0 ? 'active' : 'locked');
        var feedback = step.querySelector('[data-demo-feedback]');
        if (feedback) feedback.hidden = true;
      });

      demo.addEventListener('submit', function (event) {
        var form = event.target;
        if (!(form instanceof HTMLFormElement) || !form.matches('[data-demo-step-form]')) return;
        event.preventDefault();

        var index = Number(form.getAttribute('data-demo-step-form') || '0');
        var step = steps[index];
        if (!step || step.classList.contains('is-locked') || step.classList.contains('is-correct')) return;

        var textarea = form.querySelector('textarea');
        var feedback = form.querySelector('[data-demo-feedback]');
        var result = checkHomepageDemoStep(index, textarea ? textarea.value : '');
        if (feedback) {
          feedback.textContent = result.message;
          feedback.hidden = false;
        }

        if (!result.correct) {
          setStepState(step, 'incorrect');
          return;
        }

        setStepState(step, 'correct');
        updateProgress(index, 'correct');
        var nextStep = steps[index + 1];
        if (nextStep) {
          setStepState(nextStep, 'active');
          updateProgress(index + 1, 'active');
          var nextTextarea = nextStep.querySelector('textarea');
          if (nextTextarea) nextTextarea.focus();
        } else if (complete) {
          complete.textContent = 'Demo complete. The final answer is checked only after the preceding work is correct.';
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('static-enhanced');
    setupHomepageDemo();
    setupPracticeStacks();
    setupOneCardFlow();
    setupExamQuestionFlow();
    setupLearnModeFlow();
    setupConfidentStudentMode();
    setupExamSelfMarking();
    setupGuidedStudy();
    updateProgressText();
    renderReviewPage();

    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var topicButton = target.closest('[data-complete-field-guide-topic]');
      if (topicButton) {
        completeFieldGuideTopic(
          topicButton.getAttribute('data-region-id') || '',
          topicButton.getAttribute('data-complete-field-guide-topic') || '',
          topicButton.getAttribute('data-topic-title') || ''
        );
        return;
      }

      var guideButton = target.closest('[data-complete-field-guide]');
      if (guideButton) {
        completeWholeFieldGuide(guideButton.getAttribute('data-complete-field-guide') || '');
        return;
      }

      var hintButton = target.closest('[data-show-skill-hint]');
      if (hintButton) {
        var form = hintButton.closest('[data-check-skill-answer]');
        if (form) {
          form.setAttribute('data-used-hint', 'true');
          var hint = form.querySelector('[data-skill-hint]');
          if (hint) hint.hidden = false;
        }
      }

      var learnHintButton = target.closest('[data-show-learn-hint]');
      if (learnHintButton) {
        var learnForm = learnHintButton.closest('[data-check-learn-answer]');
        if (learnForm) {
          learnForm.setAttribute('data-used-hint', 'true');
          var learnHint = learnForm.querySelector('[data-learn-hint]');
          if (learnHint) learnHint.hidden = false;
        }
      }

      var exportButton = target.closest('[data-export-local-progress]');
      if (exportButton) {
        exportLocalProgressCsv(exportButton);
        return;
      }
    });

    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.matches('[data-check-skill-answer]')) {
        event.preventDefault();
        checkSkillAnswer(form);
        return;
      }
      if (form.matches('[data-check-learn-answer]')) {
        event.preventDefault();
        checkLearnAnswer(form);
        return;
      }
      if (form.matches('[data-save-exam-attempt]')) {
        event.preventDefault();
        saveExamAttempt(form);
      }
    });

    document.addEventListener('change', function (event) {
      var target = event.target;
      if (!(target instanceof HTMLInputElement) || target.name !== 'mistakeTags') return;
      var form = target.closest('[data-check-skill-answer], [data-check-learn-answer]');
      if (!(form instanceof HTMLFormElement)) return;
      updateTargetedPrompt(form);
      if (form.matches('[data-check-skill-answer]')) updateLatestSkillCheckAttemptMistakeTags(form);
    });

    document.addEventListener('toggle', function (event) {
      var details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
      if (details.matches('[data-mark-scheme-reveal]')) {
        var card = details.closest('.exam-question-card');
        var form = card?.querySelector('[data-save-exam-attempt]');
        var workedBeforeReveal = Boolean(card?.querySelector('[data-worked-before-reveal]')?.checked);
        if (form instanceof HTMLFormElement) {
          if (!form.getAttribute('data-mark-scheme-opened-at')) {
            form.setAttribute('data-mark-scheme-opened-at', new Date().toISOString());
          }
          if (!workedBeforeReveal && form.getAttribute('data-started-marking') !== 'true') {
            form.setAttribute('data-answer-revealed-before-marking', 'true');
          }
        }
        return;
      }
      if (details.matches('[data-learn-answer-reveal]')) {
        var learnForm = details.closest('[data-check-learn-answer]');
        if (learnForm instanceof HTMLFormElement) {
          learnForm.setAttribute('data-revealed-answer', 'true');
          var learnAfterAttempt = learnForm.querySelector('[data-learn-after-attempt]');
          if (learnAfterAttempt) learnAfterAttempt.hidden = false;
        }
        return;
      }
      var form = details.closest('[data-check-skill-answer]');
      if (!(form instanceof HTMLFormElement)) return;
      if (details.matches('[data-skill-answer-reveal]') && form.getAttribute('data-revealed-answer') !== 'true') {
        saveSkillReveal(form, 'answer');
      }
      if (details.matches('[data-skill-repair]') && form.getAttribute('data-revealed-repair-step') !== 'true') {
        saveSkillReveal(form, 'repair');
      }
    }, true);
  });
})();
