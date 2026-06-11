(function () {
  var STORAGE_KEY = 'asterion.progress.v1';
  var PROFILE_ID = 'local-static-student';
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
      var label = node.getAttribute('data-label') || 'Exam questions';
      var count = attemptsForRegion(progress, regionId).length;
      node.textContent = label + ': ' + count + ' saved';
      node.classList.toggle('is-complete', count > 0);
    });

    document.querySelectorAll('[data-total-attempts]').forEach(function (node) {
      var family = node.getAttribute('data-paper-family') || 'p3';
      var label = node.getAttribute('data-paper-label') || paperFamilyLabel(family);
      var count = attemptsForPaperFamily(progress, family).length;
      node.textContent = count + ' saved ' + label + ' attempt' + (count === 1 ? '' : 's');
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
      node.textContent = 'Local progress: ' + guideCount + '/' + fieldTotal + ' Field Guide steps, ' + practiceCount + ' Skill Check passes, ' + examCount + ' exam attempts.';
    });

    document.querySelectorAll('[data-progress-summary]').forEach(function (node) {
      var regionId = node.getAttribute('data-progress-summary') || '';
      var fieldTotal = Number(node.getAttribute('data-field-total') || 1);
      var guideCount = fieldGuideCompletedCount(progress, regionId, fieldTotal);
      var practiceCount = passingSkillAttemptsForRegion(progress, regionId).length;
      var examCount = attemptsForRegion(progress, regionId).length;
      var parts = [];
      if (guideCount > 0) parts.push(guideCount + '/' + fieldTotal + ' Field Guide');
      if (practiceCount > 0) parts.push(practiceCount + ' Skill Check pass' + (practiceCount === 1 ? '' : 'es'));
      if (examCount > 0) parts.push(examCount + ' exam attempt' + (examCount === 1 ? '' : 's'));
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
    var compact = compactAnswerText(afterEquals(value)).replace(/\*/g, '').replace(/j$/i, 'i');
    if (!compact) return undefined;
    if (!compact.includes('i')) {
      var realOnly = parseSimpleNumber(compact);
      return realOnly === undefined ? undefined : { real: realOnly, imaginary: 0 };
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
      if (submitButton) submitButton.textContent = 'Check again';
      return;
    }
    if (checkResult.isCorrect) {
      setSkillFeedback(form, 'Correct, but this was already revealed or repaired, so it is not marked passed.', 'repaired');
      if (nextButton) nextButton.hidden = false;
      return;
    }
    setSkillFeedback(form, 'Not yet. Saved as an incorrect attempt. Try again or open the repair step.', 'incorrect');
    if (submitButton) submitButton.textContent = 'Try again';
    if (mistakePanel) mistakePanel.hidden = false;
    updateTargetedPrompt(form);
    if (repair) repair.hidden = false;
    if (answerReveal) answerReveal.hidden = false;
    if (nextButton) nextButton.hidden = true;
  }

  function saveExamAttempt(form) {
    var progress = loadProgress();
    var now = new Date().toISOString();
    var marksAvailable = Number(form.getAttribute('data-marks-available') || 0);
    var marksEarned = Number(new FormData(form).get('marksEarned'));
    var mistakeType = String(new FormData(form).get('mistakeType') || '');
    var status = form.querySelector('.form-status');
    if (!Number.isFinite(marksEarned) || marksEarned < 0 || marksEarned > marksAvailable || !mistakeType) {
      if (status) status.textContent = 'Add marks and a reflection before saving.';
      return;
    }

    progress.attempts.push({
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
      mistakeType: mistakeType,
      mistakeTypes: mistakeType === 'no_issue' ? [] : [mistakeType],
      fullScoreConfirmed: marksAvailable > 0 && marksEarned === marksAvailable,
      timeSpentSeconds: 1,
      markSchemeRevealed: true,
      attemptedAt: now,
      validatedRegionId: form.getAttribute('data-validated-region-id') || undefined,
      displayRegionId: form.getAttribute('data-display-region-id') || undefined,
      worldName: 'CAIE 9709 ' + paperFamilyLabel(form.getAttribute('data-paper-family') || 'p3')
    });

    saveProgress(progress);
    if (status) status.textContent = 'Attempt saved locally.';
    form.reset();
    updateProgressText();
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
        completionAction.textContent = hasNextGroup ? 'Next skill' : 'Try exam-style questions';
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
            next.textContent = isLastCardInChunk && skillCheckGroups.length > 1 ? 'Skip for now' : 'Skip to next question';
          }
          Array.from(activeCard.querySelectorAll('[data-skill-check-inline-next]')).forEach(function (button) {
            if (!(button instanceof HTMLButtonElement)) return;
            if (isLastCardInChunk && skillCheckGroups.length > 1) {
              var groupIndex = activeSkillGroupIndex();
              button.textContent = groupIndex >= 0 && groupIndex < skillCheckGroups.length - 1 ? 'Next skill' : 'Try exam-style questions';
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
        if (next) next.textContent = bounded === tabs.length - 1 ? 'Try 3 quick questions' : 'Next subtopic';
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

  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('static-enhanced');
    setupPracticeStacks();
    setupOneCardFlow();
    setupExamQuestionFlow();
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
    });

    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.matches('[data-check-skill-answer]')) {
        event.preventDefault();
        checkSkillAnswer(form);
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
      var form = target.closest('[data-check-skill-answer]');
      if (!(form instanceof HTMLFormElement)) return;
      updateTargetedPrompt(form);
      updateLatestSkillCheckAttemptMistakeTags(form);
    });

    document.addEventListener('toggle', function (event) {
      var details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
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
