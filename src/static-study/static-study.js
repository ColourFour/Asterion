(function () {
  var STORAGE_KEY = 'asterion.progress.v1';
  var PROFILE_ID = 'local-static-student';

  function createId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  function emptyProgress() {
    return {
      schemaVersion: 1,
      attempts: [],
      learningActivityAttempts: [],
      topicProfiles: {},
      issueReports: [],
      regionLearning: {},
      settings: { activePaperFamily: 'p3' }
    };
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function loadProgress() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return emptyProgress();
      return Object.assign(emptyProgress(), parsed, {
        attempts: safeArray(parsed.attempts),
        learningActivityAttempts: safeArray(parsed.learningActivityAttempts),
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
    return progress.learningActivityAttempts.filter(function (attempt) {
      return attempt.regionId === regionId;
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
      var count = skillAttemptsForRegion(progress, regionId).length;
      node.textContent = label + ': ' + count + ' saved';
      node.classList.toggle('is-complete', count > 0);
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
      var practiceCount = skillAttemptsForRegion(progress, regionId).length;
      var examCount = attemptsForRegion(progress, regionId).length;
      node.textContent = 'Local progress: ' + guideCount + '/' + fieldTotal + ' Field Guide steps, ' + practiceCount + ' Skill Check saves, ' + examCount + ' exam attempts.';
    });

    document.querySelectorAll('[data-progress-summary]').forEach(function (node) {
      var regionId = node.getAttribute('data-progress-summary') || '';
      var fieldTotal = Number(node.getAttribute('data-field-total') || 1);
      var guideCount = fieldGuideCompletedCount(progress, regionId, fieldTotal);
      var practiceCount = skillAttemptsForRegion(progress, regionId).length;
      var examCount = attemptsForRegion(progress, regionId).length;
      var parts = [];
      if (guideCount > 0) parts.push(guideCount + '/' + fieldTotal + ' Field Guide');
      if (practiceCount > 0) parts.push(practiceCount + ' Skill Check save' + (practiceCount === 1 ? '' : 's'));
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

    document.querySelectorAll('[data-save-skill-check]').forEach(function (button) {
      var activityId = button.getAttribute('data-activity-id') || '';
      var saved = progress.learningActivityAttempts.some(function (attempt) {
        return attempt.activityId === activityId;
      });
      button.classList.toggle('is-saved', saved);
      if (saved) button.textContent = 'Done';
    });
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

  function saveSkillCheck(button) {
    var progress = loadProgress();
    var now = new Date().toISOString();
    var activityId = button.getAttribute('data-activity-id') || createId('activity');
    if (progress.learningActivityAttempts.some(function (attempt) { return attempt.activityId === activityId; })) {
      updateProgressText();
      return;
    }
    progress.learningActivityAttempts.push({
      id: createId('learn'),
      profileId: PROFILE_ID,
      regionId: button.getAttribute('data-region-id') || '',
      activityType: button.getAttribute('data-save-skill-check') || 'quick_check',
      activityId: activityId,
      topic: button.getAttribute('data-topic') || '',
      prompt: button.getAttribute('data-prompt') || 'Static practice item',
      learnerResponse: 'Completed on static page',
      revealedEarly: false,
      outcome: 'got_it',
      confidence: 3,
      createdAt: now,
      completedAt: now
    });
    saveProgress(progress);
    var status = document.createElement('p');
    status.className = 'save-status';
    status.textContent = 'Done. Review the first step if this felt shaky, then choose the next action.';
    button.insertAdjacentElement('afterend', status);
    updateProgressText();
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
          next.textContent = 'Finish check';
        } else {
          next.disabled = false;
          next.textContent = 'Next question';
        }
        if (!skillCheckGroups.length && isLastCardInChunk) {
          next.disabled = true;
        }
        if (activeCard instanceof HTMLElement) {
          Array.from(activeCard.querySelectorAll('[data-skill-check-inline-next]')).forEach(function (button) {
            if (!(button instanceof HTMLButtonElement)) return;
            if (isLastCardInChunk && skillCheckGroups.length > 1) {
              var groupIndex = activeSkillGroupIndex();
              button.textContent = groupIndex >= 0 && groupIndex < skillCheckGroups.length - 1 ? 'Next skill' : 'Try exam-style questions';
            } else {
              button.textContent = 'Next question';
            }
            button.hidden = !skillCheckGroups.length && isLastCardInChunk;
          });
        }
        previousSet.hidden = setCount <= 1;
        morePractice.hidden = setCount <= 1;
        previousSet.disabled = setIndex === 0;
        morePractice.disabled = setIndex === setCount - 1;
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

      var skillButton = target.closest('[data-save-skill-check]');
      if (skillButton) {
        saveSkillCheck(skillButton);
      }
    });

    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.matches('[data-save-exam-attempt]')) return;
      event.preventDefault();
      saveExamAttempt(form);
    });
  });
})();
