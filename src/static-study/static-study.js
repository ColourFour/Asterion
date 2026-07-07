(function () {
  var STORAGE_KEY = 'asterion.progress.v1';
  var THEME_STORAGE_KEY = 'asterion.theme.v1';
  var PROGRESS_EXPORT_KIND = 'asterion-progress-export';
  var PROGRESS_EXPORT_SCHEMA_VERSION = 1;
  var PROFILE_ID = 'local-static-student';
  var MAILTO_PROGRESS_EXPORT_MAX_LENGTH = 1800;
  var REDO_DELAY_MS = 48 * 60 * 60 * 1000;
  var REDO_COMPLETION_WEIGHT = 1.5;
  var DAY_MS = 24 * 60 * 60 * 1000;
  var correctCelebrationModal = null;
  var correctCelebrationLastFocus = null;
  var correctCelebrationPrimaryAction = null;
  var SKILL_REPAIR_INTERVALS = [
    { days: 2, label: '2-day repair' },
    { days: 7, label: 'next-week repair' }
  ];
  var P3_TOPIC_MARK_KEYS = [
    'algebra',
    'logs_exp',
    'trigonometry',
    'differentiation',
    'integration',
    'vectors',
    'complex_numbers',
    'differential_equations',
    'numerical_methods'
  ];
  var CSV_HEADERS = [
    'submission_id',
    'student_name',
    'class_group',
    'reporting_period',
    'submission_timestamp',
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
    'evidence_status_label',
    'suspicion_flags',
    'knowledge_skill_id',
    'knowledge_state_score',
    'knowledge_state_category',
    'knowledge_stability_flag',
    'knowledge_confidence',
    'knowledge_error_type',
    'knowledge_error_severity',
    'knowledge_repeat_flag',
    'knowledge_misconception_tag',
    'knowledge_evidence_strength',
    'intervention_action',
    'retest_timing',
    'follow_up_item_type',
    'follow_up_relation'
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

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }

  function systemPrefersDark() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function currentThemePreference() {
    var savedTheme = safeStorageGet(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return systemPrefersDark() ? 'dark' : 'light';
  }

  function updateThemeToggle(theme) {
    var button = document.querySelector('[data-theme-toggle]');
    if (!(button instanceof HTMLButtonElement)) return;
    var nextTheme = theme === 'dark' ? 'light' : 'dark';
    var label = button.querySelector('[data-theme-toggle-label]');
    button.setAttribute('aria-label', 'Switch to ' + nextTheme + ' mode');
    button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    button.title = 'Switch to ' + nextTheme + ' mode';
    if (label) label.textContent = nextTheme === 'dark' ? 'Dark' : 'Light';
  }

  function applyThemePreference(theme) {
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.dataset.theme = theme;
      updateThemeToggle(theme);
    }
  }

  function setupThemeToggle() {
    var button = document.querySelector('[data-theme-toggle]');
    if (!(button instanceof HTMLButtonElement)) return;
    applyThemePreference(currentThemePreference());
    button.addEventListener('click', function () {
      var currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      var nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      safeStorageSet(THEME_STORAGE_KEY, nextTheme);
      applyThemePreference(nextTheme);
    });
  }

  function createId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  function focusableCelebrationElements(dialog) {
    return Array.from(dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(function (node) {
        return node instanceof HTMLElement
          && !node.hasAttribute('disabled')
          && node.getAttribute('aria-hidden') !== 'true'
          && node.offsetParent !== null;
      });
  }

  function closeCorrectCelebration() {
    if (!correctCelebrationModal) return;
    correctCelebrationModal.root.hidden = true;
    correctCelebrationModal.root.setAttribute('data-state', 'closed');
    document.body.classList.remove('correct-celebration-open');
    correctCelebrationPrimaryAction = null;
    if (correctCelebrationLastFocus instanceof HTMLElement && document.contains(correctCelebrationLastFocus)) {
      correctCelebrationLastFocus.focus({ preventScroll: true });
    }
    correctCelebrationLastFocus = null;
  }

  function ensureCorrectCelebrationModal() {
    if (correctCelebrationModal) return correctCelebrationModal;
    if (!document.body) return null;

    var root = document.createElement('div');
    root.className = 'correct-celebration-shell';
    root.setAttribute('data-correct-celebration', '');
    root.setAttribute('data-state', 'closed');
    root.hidden = true;

    var backdrop = document.createElement('button');
    backdrop.className = 'correct-celebration-backdrop';
    backdrop.type = 'button';
    backdrop.setAttribute('data-correct-celebration-close', '');
    backdrop.setAttribute('aria-label', 'Close success message');

    var dialog = document.createElement('section');
    dialog.className = 'correct-celebration-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'correct-celebration-title');
    dialog.setAttribute('aria-describedby', 'correct-celebration-message');
    dialog.tabIndex = -1;

    var closeButton = document.createElement('button');
    closeButton.className = 'correct-celebration-close';
    closeButton.type = 'button';
    closeButton.setAttribute('data-correct-celebration-close', '');
    closeButton.setAttribute('aria-label', 'Close success message');
    closeButton.textContent = '×';

    var icon = document.createElement('div');
    icon.className = 'correct-celebration-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '✓';

    var title = document.createElement('h2');
    title.id = 'correct-celebration-title';
    title.textContent = 'Correct';

    var message = document.createElement('p');
    message.id = 'correct-celebration-message';
    message.textContent = 'That answer is correct.';

    var actions = document.createElement('div');
    actions.className = 'correct-celebration-actions';

    var primaryButton = document.createElement('button');
    primaryButton.className = 'button primary-button';
    primaryButton.type = 'button';
    primaryButton.setAttribute('data-correct-celebration-primary', '');
    primaryButton.textContent = 'Continue';

    var stayButton = document.createElement('button');
    stayButton.className = 'button secondary-button';
    stayButton.type = 'button';
    stayButton.setAttribute('data-correct-celebration-close', '');
    stayButton.textContent = 'Stay here';

    actions.append(primaryButton, stayButton);
    dialog.append(closeButton, icon, title, message, actions);
    root.append(backdrop, dialog);
    document.body.append(root);

    root.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-correct-celebration-close]')) {
        closeCorrectCelebration();
      }
    });

    primaryButton.addEventListener('click', function () {
      var action = correctCelebrationPrimaryAction;
      closeCorrectCelebration();
      if (typeof action === 'function') action();
    });

    document.addEventListener('keydown', function (event) {
      if (!correctCelebrationModal || correctCelebrationModal.root.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCorrectCelebration();
        return;
      }
      if (event.key !== 'Tab') return;
      var focusable = focusableCelebrationElements(correctCelebrationModal.dialog);
      if (!focusable.length) {
        event.preventDefault();
        correctCelebrationModal.dialog.focus();
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    correctCelebrationModal = {
      root: root,
      dialog: dialog,
      title: title,
      message: message,
      primaryButton: primaryButton
    };
    return correctCelebrationModal;
  }

  function showCorrectCelebration(options) {
    var modal = ensureCorrectCelebrationModal();
    if (!modal) return;
    correctCelebrationLastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    correctCelebrationPrimaryAction = typeof options?.onPrimary === 'function' ? options.onPrimary : null;
    modal.title.textContent = options?.title || 'Correct';
    modal.message.textContent = options?.message || 'That answer is correct.';
    modal.primaryButton.textContent = options?.primaryLabel || 'Continue';
    modal.root.hidden = false;
    modal.root.setAttribute('data-state', 'open');
    document.body.classList.add('correct-celebration-open');
    window.setTimeout(function () {
      modal.primaryButton.focus({ preventScroll: true });
    }, 0);
  }

  function celebrationButtonLabel(button, fallback) {
    return button instanceof HTMLElement && button.textContent?.trim()
      ? button.textContent.trim()
      : fallback;
  }

  function celebrationButtonAction(button) {
    return button instanceof HTMLButtonElement && !button.hidden && !button.disabled
      ? function () { button.click(); }
      : undefined;
  }

  function emptyProgress() {
    return {
      schemaVersion: 1,
      attempts: [],
      learningActivityAttempts: [],
      skillCheckAttempts: [],
      attemptHistory: { schemaVersion: 1, records: [] },
      exportProfile: {},
      diagnosticReports: [],
      p1RepairLaneModules: [],
      topicProfiles: {},
      issueReports: [],
      regionLearning: {},
      error_log: [],
      topic_performance: {},
      weak_topics: [],
      redo_queue: [],
      error_distribution: {},
      priority_repair_topics: [],
      topic_assessments: [],
      knowledge_state_graph: emptyKnowledgeGraph(),
      knowledge_state_updates: [],
      knowledge_errors: [],
      knowledge_interventions: [],
      knowledge_schedules: [],
      settings: { activePaperFamily: 'p3' }
    };
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function isRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }

  function finiteNonNegative(value) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  function roundMetric(value) {
    return Math.round(value * 1000) / 1000;
  }

  function emptyKnowledgeGraph(timestamp) {
    return {
      schemaVersion: 1,
      updatedAt: new Date(timestamp || 0).toISOString(),
      skills: {},
      misconceptions: {}
    };
  }

  function knowledgeStableId(prefix) {
    var seed = Array.prototype.slice.call(arguments, 1).filter(function (part) {
      return part !== undefined && part !== null && part !== '';
    }).join(':');
    return prefix + '_' + (seed.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'item');
  }

  function knowledgeTypeFromValue(value) {
    if (!value) return undefined;
    if ([
      'conceptual_gap',
      'procedural_gap',
      'algebraic_execution_error',
      'representation_error',
      'mis_selection_of_method',
      'careless_slip',
      'time_pressure_degradation'
    ].includes(value)) return value;
    if (value === 'CONCEPT_ERROR' || value === 'formula_issue') return 'conceptual_gap';
    if (value === 'ALGEBRA_ERROR' || value === 'algebra_error' || value === 'rounding_accuracy') return 'algebraic_execution_error';
    if (value === 'NOTATION_ERROR' || value === 'diagram_or_modeling_issue') return 'representation_error';
    if (value === 'METHOD_ERROR' || value === 'did_not_know_method' || value === 'could_not_start' || value === 'slow_method') return 'mis_selection_of_method';
    if (value === 'TIME_ERROR' || value === 'ran_out_of_time') return 'time_pressure_degradation';
    if (value === 'CARELESS_ERROR' || value === 'misread_question') return 'careless_slip';
    return undefined;
  }

  function knowledgeTypeFromTags(tags, fallback) {
    var normalized = safeArray(tags).map(function (tag) { return String(tag).toLowerCase(); });
    if (normalized.some(function (tag) { return tag.includes('time') || tag.includes('slow'); })) return 'time_pressure_degradation';
    if (normalized.some(function (tag) { return tag.includes('careless') || tag.includes('misread'); })) return 'careless_slip';
    if (normalized.some(function (tag) { return tag.includes('notation') || tag.includes('diagram') || tag.includes('graph'); })) return 'representation_error';
    if (normalized.some(function (tag) { return tag.includes('algebra') || tag.includes('sign error') || tag.includes('coefficient') || tag.includes('forgot constant'); })) return 'algebraic_execution_error';
    if (normalized.some(function (tag) { return tag.includes('concept') || tag.includes('wrong identity') || tag.includes('domain') || tag.includes('formula'); })) return 'conceptual_gap';
    if (normalized.some(function (tag) { return tag.includes('method') || tag.includes('could not start') || tag.includes('did not know'); })) return 'mis_selection_of_method';
    return knowledgeTypeFromValue(fallback) || 'procedural_gap';
  }

  function knowledgeCategory(score) {
    if (score < 30) return 'unknown';
    if (score < 50) return 'fragile';
    if (score < 70) return 'developing';
    if (score < 85) return 'stable';
    return 'secure';
  }

  function initialKnowledgeState(skillNode, timestamp) {
    return {
      skillNode: skillNode,
      score: 50,
      category: 'developing',
      confidence: 25,
      stabilityFlag: 'new_evidence',
      evidenceCount: 0,
      successStreak: 0,
      failureStreak: 0,
      lastUpdated: new Date(timestamp).toISOString(),
      errorTypeCounts: {}
    };
  }

  function knowledgeSkillNodeIds(question) {
    var ids = []
      .concat(safeArray(question.skillNodeIds))
      .concat([question.skillRef, question.primaryTopicId, question.mappedRegionId, question.regionId, question.unit])
      .filter(function (value) { return typeof value === 'string' && value.trim(); });
    return Array.from(new Set(ids));
  }

  function knowledgeSkillNodes(question) {
    if (safeArray(question.skillNodes).length) return question.skillNodes;
    var ids = knowledgeSkillNodeIds(question);
    if (!ids.length) ids = [String(question.unit || question.topic || 'p3:unknown_skill')];
    return ids.map(function (id) {
      return {
        id: id,
        label: question.topic || question.unit || '',
        course: 'p3',
        topicId: question.primaryTopicId,
        regionId: question.mappedRegionId || question.regionId,
        source: question.skillRef === id
          ? 'reviewed_skill_map'
          : question.primaryTopicId === id
            ? 'topic_route'
            : 'exam_part'
      };
    });
  }

  function knowledgeMarkPointsForQuestion(question) {
    if (safeArray(question.markPoints).length) return question.markPoints;
    var marksAvailable = finiteNonNegative(question.marksAvailable);
    var marksEarned = finiteNonNegative(question.marksEarned);
    var scoreLost = typeof question.scoreLost === 'number' && Number.isFinite(question.scoreLost)
      ? Math.max(0, question.scoreLost)
      : Math.max(0, marksAvailable - marksEarned);
    var skillNodeIds = knowledgeSkillNodeIds(question);
    var points = [];
    if (marksEarned > 0) {
      points.push({
        id: question.question_id + ':earned',
        label: 'Self-marked gained evidence',
        gained: true,
        marks: marksEarned,
        skillNodeIds: skillNodeIds,
        representation: question.representation,
        evidenceStrength: 0.55
      });
    }
    for (var index = 0; index < Math.max(0, Math.round(scoreLost)); index += 1) {
      points.push({
        id: question.question_id + ':missed:' + (index + 1),
        label: 'Self-marked missed evidence',
        gained: false,
        marks: 1,
        skillNodeIds: skillNodeIds,
        errorType: knowledgeTypeFromTags(question.mistakeTags, question.error_type),
        representation: question.representation,
        deviationFromCanonical: question.canonicalDeviation,
        evidenceStrength: 0.45
      });
    }
    return points;
  }

  function knowledgeAttemptFromAssessment(input, timestamp) {
    var questions = safeArray(input.questions);
    var skillNodeMap = {};
    questions.flatMap(knowledgeSkillNodes).forEach(function (node) {
      skillNodeMap[node.id] = Object.assign({}, skillNodeMap[node.id], node);
    });
    var markPoints = questions.flatMap(knowledgeMarkPointsForQuestion);
    var marksEarned = questions.reduce(function (sum, question) { return sum + finiteNonNegative(question.marksEarned); }, 0);
    var marksAvailable = questions.reduce(function (sum, question) { return sum + finiteNonNegative(question.marksAvailable); }, 0);
    var firstQuestion = questions[0] || {};
    return {
      attemptId: input.assessment_id,
      source: input.source,
      timestamp: timestamp,
      question: {
        questionId: questions.length === 1 ? firstQuestion.question_id : input.assessment_id,
        course: 'p3',
        topic: input.unit || firstQuestion.topic,
        regionId: firstQuestion.regionId,
        primaryTopicId: firstQuestion.primaryTopicId,
        skillNodes: Object.values(skillNodeMap),
        markPoints: markPoints,
        representation: firstQuestion.representation
      },
      response: {
        finalAnswer: input.finalAnswer,
        timeTakenSeconds: input.timeTakenSeconds,
        usedHint: input.usedHint,
        revealedAnswer: input.revealedAnswer
      },
      evaluation: {
        marksEarned: marksEarned,
        marksAvailable: marksAvailable,
        timePressure: Boolean(input.timeTakenSeconds && input.timeTakenSeconds > 0 && marksAvailable > marksEarned && input.timeTakenSeconds < 90)
      }
    };
  }

  function knowledgeSeverity(marksLost, totalLost, marksAvailable) {
    var ratio = marksAvailable > 0 ? totalLost / marksAvailable : 0;
    if (marksLost >= 3 || ratio >= 0.6) return 'high';
    if (marksLost >= 2 || ratio >= 0.3) return 'medium';
    return 'low';
  }

  function knowledgeSeverityRank(severity) {
    return severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;
  }

  function classifyKnowledgeFailure(attempt, point) {
    var explicit = knowledgeTypeFromValue(point.errorType);
    if (explicit) return explicit;
    if (attempt.evaluation.timePressure) return 'time_pressure_degradation';
    if (point.markCode && point.markCode.startsWith('M')) return 'mis_selection_of_method';
    if (point.markCode && point.markCode.startsWith('A')) return 'algebraic_execution_error';
    if (point.markCode && point.markCode.startsWith('B')) return 'procedural_gap';
    return 'procedural_gap';
  }

  function knowledgeHumanErrorType(errorType) {
    return String(errorType || '').replace(/_/g, ' ');
  }

  function applyKnowledgeMisconceptions(errors, priorErrors, graph, timestamp) {
    errors.forEach(function (error) {
      var related = priorErrors.concat(errors).filter(function (candidate) {
        return candidate.primarySkillNodeId === error.primarySkillNodeId && candidate.errorType === error.errorType;
      });
      var questionIds = Array.from(new Set(related.map(function (candidate) { return candidate.questionId; }).filter(Boolean)));
      var representationIds = Array.from(new Set(related.map(function (candidate) { return candidate.representation; }).filter(Boolean)));
      var nearMissCount = related.filter(function (candidate) { return candidate.severity === 'low' && candidate.marksLost <= 1; }).length;
      if (questionIds.length < 2 && representationIds.length < 2 && nearMissCount < 3) return;
      var pattern = representationIds.length >= 2 ? 'across-representations' : nearMissCount >= 3 ? 'near-miss' : 'repeated';
      var tag = [error.primarySkillNodeId, error.errorType, pattern].join(':').toLowerCase().replace(/[^a-z0-9:_-]+/g, '_');
      var state = graph.skills[error.primarySkillNodeId];
      graph.misconceptions[tag] = {
        tag: tag,
        skillNodeId: error.primarySkillNodeId,
        description: (state?.skillNode?.label || error.primarySkillNodeId) + ': ' + knowledgeHumanErrorType(error.errorType),
        errorType: error.errorType,
        evidenceCount: related.length,
        questionIds: questionIds,
        representationIds: representationIds,
        lastSeenAt: new Date(timestamp).toISOString(),
        stable: related.length >= 3 || questionIds.length >= 3
      };
      error.misconceptionTag = tag;
      error.repeat = true;
    });
  }

  function applyKnowledgeAssessment(progress, input, timestamp) {
    progress.knowledge_state_graph = isRecord(progress.knowledge_state_graph) ? progress.knowledge_state_graph : emptyKnowledgeGraph(timestamp);
    progress.knowledge_state_graph.skills = isRecord(progress.knowledge_state_graph.skills) ? progress.knowledge_state_graph.skills : {};
    progress.knowledge_state_graph.misconceptions = isRecord(progress.knowledge_state_graph.misconceptions) ? progress.knowledge_state_graph.misconceptions : {};
    progress.knowledge_state_graph.updatedAt = new Date(timestamp).toISOString();
    progress.knowledge_state_updates = safeArray(progress.knowledge_state_updates);
    progress.knowledge_errors = safeArray(progress.knowledge_errors);
    progress.knowledge_interventions = safeArray(progress.knowledge_interventions);
    progress.knowledge_schedules = safeArray(progress.knowledge_schedules);

    var attempt = knowledgeAttemptFromAssessment(input, timestamp);
    var graph = progress.knowledge_state_graph;
    var questionNodes = safeArray(attempt.question.skillNodes);
    if (!questionNodes.length) questionNodes = [{ id: attempt.question.regionId || attempt.question.topic || 'p3:unknown_skill', source: 'fallback_region' }];
    questionNodes.forEach(function (node) {
      if (!graph.skills[node.id]) graph.skills[node.id] = initialKnowledgeState(node, timestamp);
    });

    var totalLost = Math.max(0, finiteNonNegative(attempt.evaluation.marksAvailable) - finiteNonNegative(attempt.evaluation.marksEarned));
    var missedPoints = safeArray(attempt.question.markPoints).filter(function (point) { return !point.gained; });
    var errors = missedPoints.map(function (point, index) {
      var skillNodeIds = safeArray(point.skillNodeIds).length ? point.skillNodeIds : questionNodes.map(function (node) { return node.id; });
      var primarySkillNodeId = skillNodeIds[0];
      var errorType = classifyKnowledgeFailure(attempt, point);
      var marksLost = Math.max(1, finiteNonNegative(point.marks || 1));
      var severity = knowledgeSeverity(marksLost, totalLost, attempt.evaluation.marksAvailable);
      var repeat = progress.knowledge_errors.some(function (candidate) {
        return candidate.primarySkillNodeId === primarySkillNodeId && candidate.errorType === errorType;
      });
      var strength = Math.min(1, (point.evidenceStrength || 0.75) + (severity === 'high' ? 0.15 : severity === 'medium' ? 0.08 : 0) + (repeat ? 0.08 : 0));
      return {
        id: knowledgeStableId('kerr', attempt.attemptId, attempt.question.questionId, point.id, index, timestamp),
        attemptId: attempt.attemptId,
        questionId: attempt.question.questionId,
        markPointId: point.id,
        markPointLabel: point.label,
        skillNodeIds: skillNodeIds,
        primarySkillNodeId: primarySkillNodeId,
        errorType: errorType,
        severity: severity,
        repeat: repeat,
        evidenceStrength: roundMetric(strength),
        evidenceSource: attempt.source,
        marksLost: marksLost,
        timestamp: new Date(timestamp).toISOString(),
        representation: point.representation || attempt.question.representation,
        deviationFromCanonical: point.deviationFromCanonical
      };
    });
    applyKnowledgeMisconceptions(errors, progress.knowledge_errors, graph, timestamp);

    var evidenceBySkill = {};
    safeArray(attempt.question.markPoints).forEach(function (point) {
      if (!point.gained) return;
      var ids = safeArray(point.skillNodeIds).length ? point.skillNodeIds : questionNodes.map(function (node) { return node.id; });
      ids.forEach(function (id) {
        evidenceBySkill[id] = evidenceBySkill[id] || { errors: [], successWeight: 0, strength: 0.5 };
        evidenceBySkill[id].successWeight += Math.max(1, finiteNonNegative(point.marks || 1));
        evidenceBySkill[id].strength = Math.max(evidenceBySkill[id].strength, point.evidenceStrength || 0.6);
      });
    });
    errors.forEach(function (error) {
      error.skillNodeIds.forEach(function (id) {
        evidenceBySkill[id] = evidenceBySkill[id] || { errors: [], successWeight: 0, strength: 0.5 };
        evidenceBySkill[id].errors.push(error);
        evidenceBySkill[id].strength = Math.max(evidenceBySkill[id].strength, error.evidenceStrength);
      });
    });

    var updates = Object.keys(evidenceBySkill).map(function (skillNodeId) {
      var evidence = evidenceBySkill[skillNodeId];
      var state = graph.skills[skillNodeId] || initialKnowledgeState({ id: skillNodeId, source: 'fallback_region' }, timestamp);
      var previousScore = typeof state.score === 'number' ? state.score : 50;
      var previousCategory = state.category || knowledgeCategory(previousScore);
      var failure = evidence.errors.length > 0;
      var worst = evidence.errors.reduce(function (current, error) {
        return knowledgeSeverityRank(error.severity) > knowledgeSeverityRank(current) ? error.severity : current;
      }, 'low');
      var baseDelta = failure
        ? (worst === 'high' ? -20 : worst === 'medium' ? -14 : -8)
        : (state.lastOutcome === 'success' ? 9 : state.lastOutcome === 'failure' ? 6 : 4);
      if (failure && !state.evidenceCount) baseDelta -= 6;
      if (failure && state.lastOutcome === 'success' && state.successStreak > 0) baseDelta -= 6;
      if (failure && evidence.errors.some(function (error) { return error.repeat; })) baseDelta -= 4;
      var nextScore = Math.max(0, Math.min(100, previousScore + baseDelta));
      var stability = failure && state.lastOutcome === 'success' && state.successStreak > 0
        ? 'volatile'
        : failure
          ? (nextScore < 50 ? 'fragile' : 'volatile')
          : state.lastOutcome === 'failure'
            ? 'recovering'
            : state.successStreak >= 1 && nextScore >= 70
              ? 'stable_understanding'
              : 'new_evidence';
      var errorTypeCounts = Object.assign({}, state.errorTypeCounts || {});
      evidence.errors.forEach(function (error) {
        errorTypeCounts[error.errorType] = (errorTypeCounts[error.errorType] || 0) + 1;
      });
      graph.skills[skillNodeId] = Object.assign({}, state, {
        score: roundMetric(nextScore),
        category: knowledgeCategory(nextScore),
        confidence: roundMetric(Math.min(100, (state.confidence || 25) + Math.max(3, (failure ? 9 : 6) * evidence.strength))),
        stabilityFlag: stability,
        evidenceCount: (state.evidenceCount || 0) + 1,
        successStreak: failure ? 0 : (state.successStreak || 0) + 1,
        failureStreak: failure ? (state.failureStreak || 0) + 1 : 0,
        lastOutcome: failure ? 'failure' : 'success',
        lastUpdated: new Date(timestamp).toISOString(),
        lastAttemptId: attempt.attemptId,
        lastQuestionId: attempt.question.questionId,
        errorTypeCounts: errorTypeCounts
      });
      return {
        id: knowledgeStableId('ksu', attempt.attemptId, skillNodeId, timestamp),
        attemptId: attempt.attemptId,
        questionId: attempt.question.questionId,
        skillNodeId: skillNodeId,
        previousScore: roundMetric(previousScore),
        newScore: roundMetric(nextScore),
        previousCategory: previousCategory,
        newCategory: knowledgeCategory(nextScore),
        confidence: graph.skills[skillNodeId].confidence,
        stabilityFlag: stability,
        outcome: failure ? 'failure' : 'success',
        evidenceStrength: roundMetric(evidence.strength),
        timestamp: new Date(timestamp).toISOString()
      };
    });

    var selectedError = errors.slice().sort(function (a, b) {
      return knowledgeSeverityRank(b.severity) - knowledgeSeverityRank(a.severity) || Number(b.repeat) - Number(a.repeat);
    })[0];
    var selectedUpdate = selectedError
      ? updates.find(function (update) { return update.skillNodeId === selectedError.primarySkillNodeId; }) || updates[0]
      : updates.slice().sort(function (a, b) { return (b.newScore - b.previousScore) - (a.newScore - a.previousScore); })[0];
    var selectedSkillId = selectedError?.primarySkillNodeId || selectedUpdate?.skillNodeId || questionNodes[0].id;
    var selectedState = graph.skills[selectedSkillId] || initialKnowledgeState({ id: selectedSkillId, source: 'fallback_region' }, timestamp);
    var action = 'similar_question';
    if (!selectedError) action = selectedState.score >= 70 && selectedState.stabilityFlag === 'stable_understanding' ? 'transfer_challenge' : 'delayed_retest';
    else if (selectedUpdate?.stabilityFlag === 'volatile') action = 'delayed_retest';
    else if (selectedError.misconceptionTag || selectedError.repeat) action = 'drill_set';
    else if (selectedState.category === 'unknown' || selectedState.category === 'fragile' || selectedError.errorType === 'conceptual_gap' || selectedError.errorType === 'mis_selection_of_method') action = 'micro_reteach';
    else if (selectedError.errorType === 'careless_slip' || selectedError.errorType === 'time_pressure_degradation') action = 'delayed_retest';
    var intervention = {
      id: knowledgeStableId('kint', attempt.attemptId, selectedSkillId, action, timestamp),
      attemptId: attempt.attemptId,
      skillNodeId: selectedSkillId,
      action: action,
      rationale: selectedError ? 'State change after ' + knowledgeHumanErrorType(selectedError.errorType) : 'State changed after successful evidence.',
      stateChange: {
        previousScore: selectedUpdate?.previousScore || selectedState.score,
        newScore: selectedUpdate?.newScore || selectedState.score,
        category: selectedState.category,
        stabilityFlag: selectedState.stabilityFlag
      },
      sourceErrorIds: selectedError ? [selectedError.id] : [],
      createdAt: new Date(timestamp).toISOString()
    };
    var delayed = action === 'delayed_retest' || action === 'transfer_challenge';
    var schedule = {
      id: knowledgeStableId('ksch', intervention.id, action, timestamp),
      interventionId: intervention.id,
      attemptId: attempt.attemptId,
      skillNodeId: selectedSkillId,
      retestTiming: delayed ? 'delayed' : 'immediate',
      followUpItemType: action,
      difficultyRelation: action === 'transfer_challenge' ? 'cross_skill' : 'isomorphic',
      dueAt: new Date(timestamp + (delayed ? (action === 'transfer_challenge' ? 72 * 60 * 60 * 1000 : REDO_DELAY_MS) : 0)).toISOString(),
      reason: delayed ? 'Re-test after spacing to check stability.' : 'Act immediately on the state change.',
      createdAt: new Date(timestamp).toISOString()
    };

    progress.knowledge_state_updates = progress.knowledge_state_updates.concat(updates);
    progress.knowledge_errors = progress.knowledge_errors.concat(errors);
    progress.knowledge_interventions.push(intervention);
    progress.knowledge_schedules.push(schedule);
  }

  function normalizeTopicCandidate(value) {
    return String(value || '')
      .replace(/^9709_[a-z0-9]+_topic_/i, '')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function topicKeyFromMetadata(input) {
    var candidates = [
      input?.regionId,
      input?.mappedRegionId,
      input?.primaryTopicId,
      input?.unit,
      input?.topic
    ].filter(Boolean);
    for (var index = 0; index < candidates.length; index += 1) {
      var normalized = normalizeTopicCandidate(candidates[index]);
      if (normalized.includes('logarith') || normalized.includes('exponential') || normalized === 'logs_exp') return 'logs_exp';
      if (normalized.includes('trig')) return 'trigonometry';
      if (normalized.includes('differential_equation')) return 'differential_equations';
      if (normalized.includes('differentiat')) return 'differentiation';
      if (normalized.includes('integrat')) return 'integration';
      if (normalized.includes('vector')) return 'vectors';
      if (normalized.includes('complex')) return 'complex_numbers';
      if (normalized.includes('numerical') || normalized.includes('iteration')) return 'numerical_methods';
      if (normalized.includes('algebra') || normalized.includes('polynomial') || normalized.includes('binomial') || normalized.includes('partial_fraction')) return 'algebra';
    }
    return 'algebra';
  }

  function emptyTopicScores() {
    return P3_TOPIC_MARK_KEYS.reduce(function (scores, key) {
      scores[key] = { score_lost: 0, questions: 0 };
      return scores;
    }, {});
  }

  function emptyTopicPerformance() {
    return {
      score_lost: 0,
      questions: 0,
      attempts: 0,
      marks_available: 0,
      marks_earned: 0,
      redo_marks_repaired: 0,
      stability_score: 100,
      history: []
    };
  }

  function errorTypeFromTags(tags) {
    var normalized = safeArray(tags).map(function (tag) { return String(tag).toLowerCase(); });
    if (normalized.some(function (tag) { return tag.includes('algebra') || tag.includes('sign error') || tag.includes('coefficient') || tag.includes('forgot constant'); })) return 'ALGEBRA_ERROR';
    if (normalized.some(function (tag) { return tag.includes('notation'); })) return 'NOTATION_ERROR';
    if (normalized.some(function (tag) { return tag.includes('calculator'); })) return 'CALCULATOR_ERROR';
    if (normalized.some(function (tag) { return tag.includes('time') || tag.includes('slow'); })) return 'TIME_ERROR';
    if (normalized.some(function (tag) { return tag.includes('careless') || tag.includes('misread'); })) return 'CARELESS_ERROR';
    if (normalized.some(function (tag) { return tag.includes('concept') || tag.includes('wrong identity') || tag.includes('domain'); })) return 'CONCEPT_ERROR';
    return 'METHOD_ERROR';
  }

  function isErrorType(value) {
    return [
      'CONCEPT_ERROR',
      'ALGEBRA_ERROR',
      'NOTATION_ERROR',
      'METHOD_ERROR',
      'CALCULATOR_ERROR',
      'TIME_ERROR',
      'CARELESS_ERROR'
    ].includes(value);
  }

  function normalizeErrorType(value, tags) {
    return isErrorType(value) ? value : errorTypeFromTags(tags);
  }

  function pathErrorType(errorType) {
    if (errorType === 'CONCEPT_ERROR') return 'concept';
    if (errorType === 'ALGEBRA_ERROR' || errorType === 'NOTATION_ERROR' || errorType === 'CALCULATOR_ERROR') return 'algebra';
    if (errorType === 'TIME_ERROR') return 'time';
    if (errorType === 'CARELESS_ERROR') return 'careless';
    return 'method';
  }

  function createStableAnalyticsId(prefix, seed, timestamp) {
    var normalizedSeed = String(seed || 'item').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48) || 'item';
    return prefix + '_' + normalizedSeed + '_' + Math.round(timestamp).toString(36);
  }

  function severityForScoreLost(scoreLost) {
    if (scoreLost >= 4) return 'HIGH';
    if (scoreLost >= 2) return 'MEDIUM';
    return 'LOW';
  }

  function generateErrorLogEntry(input) {
    var timestamp = Number.isFinite(input.timestamp) ? Number(input.timestamp) : Date.now();
    var scoreLost = Math.max(0, finiteNonNegative(input.original_score_lost));
    var errorType = normalizeErrorType(input.error_type, input.mistakeTags);
    return {
      id: input.id || createStableAnalyticsId('err', input.question_id, timestamp),
      student_id: input.student_id || PROFILE_ID,
      unit: input.unit || input.topic || '',
      topic: input.topic || input.unit || '',
      question_id: input.question_id,
      error_type: errorType,
      timestamp: timestamp,
      severity: input.severity || severityForScoreLost(scoreLost),
      original_score_lost: roundMetric(scoreLost),
      redo_available_at: timestamp + REDO_DELAY_MS,
      redo_completed: false,
      redo_success: false
    };
  }

  function redoItemForError(error) {
    return {
      id: createStableAnalyticsId('redo', error.id, error.timestamp),
      error_log_id: error.id,
      question_id: error.question_id,
      error_type: pathErrorType(error.error_type),
      error_type_detail: error.error_type,
      unit: error.unit,
      topic: error.topic,
      original_score_lost: error.original_score_lost,
      missed_at: new Date(error.timestamp).toISOString(),
      redo_available_at: new Date(error.redo_available_at).toISOString(),
      redo_success: false,
      status: 'pending'
    };
  }

  function computeTopicBreakdown(input) {
    var topicScores = emptyTopicScores();
    var totalScore = 0;
    var totalLost = 0;
    safeArray(input.questions).forEach(function (question) {
      var topicKey = topicKeyFromMetadata(question);
      var marksAvailable = finiteNonNegative(question.marksAvailable);
      var marksEarned = finiteNonNegative(question.marksEarned);
      var scoreLost = typeof question.scoreLost === 'number' && Number.isFinite(question.scoreLost)
        ? Math.max(0, question.scoreLost)
        : Math.max(0, marksAvailable - marksEarned);
      topicScores[topicKey].score_lost += scoreLost;
      topicScores[topicKey].questions += 1;
      totalScore += marksEarned;
      totalLost += scoreLost;
    });
    return {
      assessment_id: input.assessment_id,
      unit: input.unit || safeArray(input.questions)[0]?.unit || '',
      topic_scores: topicScores,
      total_score: roundMetric(totalScore),
      total_marks_lost: roundMetric(totalLost)
    };
  }

  function stabilityScore(history) {
    var rates = safeArray(history)
      .filter(function (entry) { return entry.questions > 0; })
      .map(function (entry) { return entry.score_lost / entry.questions; });
    if (rates.length < 2) return 100;
    var mean = rates.reduce(function (sum, rate) { return sum + rate; }, 0) / rates.length;
    var variance = rates.reduce(function (sum, rate) { return sum + Math.pow(rate - mean, 2); }, 0) / rates.length;
    return roundMetric(Math.max(0, 100 - Math.sqrt(variance) * 25));
  }

  function recordTopicPerformance(progress, topic, record) {
    var current = progress.topic_performance[topic] || emptyTopicPerformance();
    var history = safeArray(current.history).concat({
      assessment_id: record.assessmentId,
      timestamp: record.timestamp,
      score_lost: roundMetric(record.scoreLost),
      questions: record.questions,
      source: record.source
    });
    progress.topic_performance[topic] = {
      score_lost: roundMetric(current.score_lost + record.scoreLost),
      questions: current.questions + record.questions,
      attempts: current.attempts + 1,
      marks_available: roundMetric(current.marks_available + record.marksAvailable),
      marks_earned: roundMetric(current.marks_earned + record.marksEarned),
      redo_marks_repaired: roundMetric(current.redo_marks_repaired + record.redoMarksRepaired),
      stability_score: stabilityScore(history),
      history: history
    };
  }

  function priorityScore(stats) {
    return stats.score_lost + (100 - stats.stability_score) / 10 - stats.redo_marks_repaired / 10;
  }

  function refreshDerivedAnalytics(progress) {
    var topicEntries = Object.entries(progress.topic_performance || {});
    progress.weak_topics = topicEntries
      .filter(function (entry) { return entry[1].score_lost > 0; })
      .sort(function (a, b) { return b[1].score_lost - a[1].score_lost || a[0].localeCompare(b[0]); })
      .map(function (entry) { return entry[0]; });
    var errorCounts = safeArray(progress.error_log).reduce(function (counts, entry) {
      counts[entry.error_type] = (counts[entry.error_type] || 0) + 1;
      return counts;
    }, {});
    var errorTotal = safeArray(progress.error_log).length || 1;
    progress.error_distribution = Object.fromEntries(Object.entries(errorCounts).map(function (entry) {
      return [entry[0], roundMetric((entry[1] / errorTotal) * 100)];
    }));
    progress.priority_repair_topics = topicEntries
      .filter(function (entry) { return entry[1].score_lost > 0; })
      .sort(function (a, b) { return priorityScore(b[1]) - priorityScore(a[1]) || a[0].localeCompare(b[0]); })
      .slice(0, 3)
      .map(function (entry) { return entry[0]; });
    return progress;
  }

  function normalizeAnalyticsProgress(progress) {
    progress.error_log = safeArray(progress.error_log).filter(function (entry) {
      return entry && typeof entry.id === 'string' && typeof entry.question_id === 'string' && isErrorType(entry.error_type);
    });
    progress.topic_performance = isRecord(progress.topic_performance) ? progress.topic_performance : {};
    progress.weak_topics = safeArray(progress.weak_topics).filter(function (topic) { return typeof topic === 'string'; });
    progress.redo_queue = safeArray(progress.redo_queue).filter(function (item) {
      return item && typeof item.question_id === 'string';
    });
    progress.error_distribution = isRecord(progress.error_distribution) ? progress.error_distribution : {};
    progress.priority_repair_topics = safeArray(progress.priority_repair_topics).filter(function (topic) { return typeof topic === 'string'; });
    progress.topic_assessments = safeArray(progress.topic_assessments);
    progress.knowledge_state_graph = isRecord(progress.knowledge_state_graph) ? progress.knowledge_state_graph : emptyKnowledgeGraph(0);
    progress.knowledge_state_graph.skills = isRecord(progress.knowledge_state_graph.skills) ? progress.knowledge_state_graph.skills : {};
    progress.knowledge_state_graph.misconceptions = isRecord(progress.knowledge_state_graph.misconceptions) ? progress.knowledge_state_graph.misconceptions : {};
    progress.knowledge_state_updates = safeArray(progress.knowledge_state_updates);
    progress.knowledge_errors = safeArray(progress.knowledge_errors);
    progress.knowledge_interventions = safeArray(progress.knowledge_interventions);
    progress.knowledge_schedules = safeArray(progress.knowledge_schedules);
    return progress;
  }

  function updateStudentPerformanceState(progress, input) {
    normalizeAnalyticsProgress(progress);
    if (input.kind === 'redo_completion') {
      var completedAt = Number.isFinite(input.completed_at) ? Number(input.completed_at) : Date.now();
      var matchedError = progress.error_log.find(function (entry) { return entry.id === input.error_log_id; });
      if (!matchedError) return refreshDerivedAnalytics(progress);
      progress.error_log = progress.error_log.map(function (entry) {
        return entry.id === input.error_log_id ? Object.assign({}, entry, { redo_completed: true, redo_success: input.redo_success }) : entry;
      });
      progress.redo_queue = progress.redo_queue.map(function (item) {
        return item.error_log_id === input.error_log_id
          ? Object.assign({}, item, {
            redo_completed_at: new Date(completedAt).toISOString(),
            redo_success: input.redo_success,
            status: input.redo_success ? 'corrected_full_solution' : 'completed'
          })
          : item;
      });
      recordTopicPerformance(progress, topicKeyFromMetadata(matchedError), {
        assessmentId: 'redo:' + matchedError.id,
        timestamp: completedAt,
        source: 'redo',
        scoreLost: input.redo_success ? 0 : matchedError.original_score_lost,
        questions: 1,
        marksAvailable: matchedError.original_score_lost,
        marksEarned: input.redo_success ? matchedError.original_score_lost : 0,
        redoMarksRepaired: input.redo_success ? finiteNonNegative(input.marks_repaired || matchedError.original_score_lost) * REDO_COMPLETION_WEIGHT : 0
      });
      return refreshDerivedAnalytics(progress);
    }

    var timestamp = Number.isFinite(input.timestamp) ? Number(input.timestamp) : Date.now();
    var breakdown = computeTopicBreakdown(input);
    progress.topic_assessments = safeArray(progress.topic_assessments).concat(breakdown);
    safeArray(input.questions).forEach(function (question) {
      var marksAvailable = finiteNonNegative(question.marksAvailable);
      var marksEarned = finiteNonNegative(question.marksEarned);
      var scoreLost = typeof question.scoreLost === 'number' && Number.isFinite(question.scoreLost)
        ? Math.max(0, question.scoreLost)
        : Math.max(0, marksAvailable - marksEarned);
      var topic = topicKeyFromMetadata(question);
      recordTopicPerformance(progress, topic, {
        assessmentId: input.assessment_id,
        timestamp: timestamp,
        source: input.source,
        scoreLost: scoreLost,
        questions: 1,
        marksAvailable: marksAvailable,
        marksEarned: marksEarned,
        redoMarksRepaired: 0
      });
      if (scoreLost <= 0) return;
      var error = generateErrorLogEntry({
        student_id: input.student_id || PROFILE_ID,
        unit: question.unit || input.unit || topic,
        topic: topic,
        question_id: question.question_id,
        error_type: normalizeErrorType(question.error_type, question.mistakeTags),
        mistakeTags: question.mistakeTags,
        timestamp: timestamp,
        original_score_lost: scoreLost
      });
      progress.error_log.push(error);
      progress.redo_queue.push(redoItemForError(error));
    });
    applyKnowledgeAssessment(progress, input, timestamp);
    return refreshDerivedAnalytics(progress);
  }

  function updateErrorClassificationFromTags(progress, questionId, tags) {
    normalizeAnalyticsProgress(progress);
    var index = progress.error_log.map(function (entry) { return entry.question_id; }).lastIndexOf(questionId);
    if (index < 0) return refreshDerivedAnalytics(progress);
    var errorType = errorTypeFromTags(tags);
    var error = Object.assign({}, progress.error_log[index], { error_type: errorType });
    progress.error_log[index] = error;
    progress.redo_queue = progress.redo_queue.map(function (item) {
      return item.error_log_id === error.id || item.question_id === questionId
        ? Object.assign({}, item, { error_type: pathErrorType(errorType), error_type_detail: errorType })
        : item;
    });
    var knowledgeIndex = safeArray(progress.knowledge_errors).map(function (entry) { return entry.questionId; }).lastIndexOf(questionId);
    if (knowledgeIndex >= 0) {
      var previous = progress.knowledge_errors[knowledgeIndex];
      var nextType = knowledgeTypeFromTags(tags, previous.errorType);
      progress.knowledge_errors[knowledgeIndex] = Object.assign({}, previous, {
        errorType: nextType,
        misconceptionTag: undefined
      });
      safeArray(previous.skillNodeIds).forEach(function (skillNodeId) {
        var state = progress.knowledge_state_graph?.skills?.[skillNodeId];
        if (!state) return;
        var counts = Object.assign({}, state.errorTypeCounts || {});
        counts[previous.errorType] = Math.max(0, (counts[previous.errorType] || 0) - 1);
        counts[nextType] = (counts[nextType] || 0) + 1;
        progress.knowledge_state_graph.skills[skillNodeId] = Object.assign({}, state, { errorTypeCounts: counts });
      });
    }
    return refreshDerivedAnalytics(progress);
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

  function isStudentAttemptHistoryRecord(value) {
    return Boolean(value && typeof value === 'object'
      && typeof value.id === 'string'
      && (value.source === 'checked_practice' || value.source === 'learn_mode')
      && value.course === 'p3'
      && typeof value.questionId === 'string'
      && typeof value.response === 'string'
      && typeof value.correct === 'boolean'
      && typeof value.timestamp === 'string'
      && typeof value.attemptNumber === 'number'
      && Number.isFinite(value.attemptNumber)
      && value.attemptNumber >= 1);
  }

  function normalizeStudentAttemptHistory(history) {
    return {
      schemaVersion: 1,
      records: history && typeof history === 'object' && Array.isArray(history.records)
        ? history.records.filter(isStudentAttemptHistoryRecord)
        : []
    };
  }

  function nextStudentAttemptNumber(history, questionId) {
    var numbers = normalizeStudentAttemptHistory(history).records
      .filter(function (record) { return record.questionId === questionId; })
      .map(function (record) { return record.attemptNumber; });
    return numbers.length ? Math.max.apply(null, numbers) + 1 : 1;
  }

  function appendStudentAttemptHistoryRecord(progress, record) {
    var history = normalizeStudentAttemptHistory(progress.attemptHistory);
    var attemptNumber = typeof record.attemptNumber === 'number' && Number.isFinite(record.attemptNumber) && record.attemptNumber >= 1
      ? record.attemptNumber
      : nextStudentAttemptNumber(history, record.questionId);
    progress.attemptHistory = {
      schemaVersion: 1,
      records: history.records.concat(Object.assign({}, record, { attemptNumber: attemptNumber }))
    };
    return progress;
  }

  function loadProgress() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      return normalizeStoredProgress(parsed);
    } catch (_error) {
      return emptyProgress();
    }
  }

  function normalizeStoredProgress(parsed) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyProgress();
    return normalizeAnalyticsProgress(Object.assign(emptyProgress(), parsed, {
      schemaVersion: typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1,
      attempts: safeArray(parsed.attempts),
      learningActivityAttempts: safeArray(parsed.learningActivityAttempts),
      skillCheckAttempts: normalizeSkillCheckAttempts(parsed.skillCheckAttempts),
      attemptHistory: normalizeStudentAttemptHistory(parsed.attemptHistory),
      exportProfile: parsed.exportProfile && typeof parsed.exportProfile === 'object' ? parsed.exportProfile : {},
      diagnosticReports: safeArray(parsed.diagnosticReports),
      p1RepairLaneModules: safeArray(parsed.p1RepairLaneModules),
      topicProfiles: parsed.topicProfiles && typeof parsed.topicProfiles === 'object' ? parsed.topicProfiles : {},
      issueReports: safeArray(parsed.issueReports),
      regionLearning: parsed.regionLearning && typeof parsed.regionLearning === 'object' ? parsed.regionLearning : {},
      error_log: safeArray(parsed.error_log),
      topic_performance: parsed.topic_performance && typeof parsed.topic_performance === 'object' ? parsed.topic_performance : {},
      weak_topics: safeArray(parsed.weak_topics),
      redo_queue: safeArray(parsed.redo_queue),
      error_distribution: parsed.error_distribution && typeof parsed.error_distribution === 'object' ? parsed.error_distribution : {},
      priority_repair_topics: safeArray(parsed.priority_repair_topics),
      topic_assessments: safeArray(parsed.topic_assessments),
      knowledge_state_graph: parsed.knowledge_state_graph && typeof parsed.knowledge_state_graph === 'object' ? parsed.knowledge_state_graph : emptyKnowledgeGraph(0),
      knowledge_state_updates: safeArray(parsed.knowledge_state_updates),
      knowledge_errors: safeArray(parsed.knowledge_errors),
      knowledge_interventions: safeArray(parsed.knowledge_interventions),
      knowledge_schedules: safeArray(parsed.knowledge_schedules),
      settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : { activePaperFamily: 'p3' }
    }));
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

  function cleanExportValue(value) {
    return value === undefined || value === null ? '' : String(value).trim();
  }

  function normalizeExportMetadata(metadata, fallbackTimestamp) {
    var normalized = metadata && typeof metadata === 'object' ? metadata : {};
    return {
      submissionId: cleanExportValue(normalized.submissionId),
      studentName: cleanExportValue(normalized.studentName),
      classGroup: cleanExportValue(normalized.classGroup),
      teacherEmail: cleanExportValue(normalized.teacherEmail),
      reportingPeriod: cleanExportValue(normalized.reportingPeriod),
      submissionTimestamp: cleanExportValue(normalized.submissionTimestamp) || fallbackTimestamp
    };
  }

  function csvRowWithExportMetadata(row, metadata) {
    return Object.assign(row, {
      submission_id: metadata.submissionId,
      student_name: metadata.studentName,
      class_group: metadata.classGroup,
      reporting_period: metadata.reportingPeriod,
      submission_timestamp: metadata.submissionTimestamp
    });
  }

  function localProgressSubmissionSummary(progress) {
    var skillAttempts = normalizeSkillCheckAttempts(progress.skillCheckAttempts);
    var reviewCandidates = skillAttempts.filter(function (attempt) {
      return Boolean(reviewCsvRow(attempt, ''));
    }).length;
    var examAttempts = safeArray(progress.attempts);
    return {
      checkedPracticeAttempts: skillAttempts.length,
      checkedPracticePasses: skillAttempts.filter(isCleanCheckedPracticeAttempt).length,
      reviewCandidates: reviewCandidates,
      selfMarkedExamAttempts: examAttempts.filter(function (attempt) { return attempt.selfMarked === true; }).length,
      learningActivityAttempts: safeArray(progress.learningActivityAttempts).length,
      knowledgeStateUpdates: safeArray(progress.knowledge_state_updates).length,
      knowledgeErrors: safeArray(progress.knowledge_errors).length,
      knowledgeInterventions: safeArray(progress.knowledge_interventions).length
    };
  }

  function localProgressSummaryText(summary) {
    return [
      'checked_practice_attempts=' + summary.checkedPracticeAttempts,
      'checked_practice_passes=' + summary.checkedPracticePasses,
      'review_candidates=' + summary.reviewCandidates,
      'self_marked_exam_attempts=' + summary.selfMarkedExamAttempts,
      'learning_activity_attempts=' + summary.learningActivityAttempts,
      'knowledge_state_updates=' + summary.knowledgeStateUpdates,
      'knowledge_errors=' + summary.knowledgeErrors,
      'knowledge_interventions=' + summary.knowledgeInterventions
    ].join('; ');
  }

  function localProgressTeacherSummary(progress, requirements) {
    var skillAttempts = normalizeSkillCheckAttempts(progress.skillCheckAttempts);
    var learningAttempts = safeArray(progress.learningActivityAttempts);
    var examAttempts = safeArray(progress.attempts);
    var validRequirements = safeArray(requirements).filter(function (requirement) {
      return requirement
        && typeof requirement.regionId === 'string'
        && typeof requirement.name === 'string'
        && Array.isArray(requirement.requiredCheckIds);
    });
    var unitStatuses = validRequirements.map(function (requirement) {
      return Object.assign({ requirement: requirement }, teacherExamReviewRequirementStatus(progress, requirement));
    });
    var completeUnits = unitStatuses.filter(function (status) { return status.complete; }).map(function (status) {
      return status.requirement.name;
    });
    var incompleteUnits = unitStatuses.filter(function (status) { return !status.complete; }).map(function (status) {
      return status.requirement.name;
    });
    return {
      completeUnits: validRequirements.length ? completeUnits : undefined,
      incompleteUnits: validRequirements.length ? incompleteUnits : undefined,
      totalCleanPasses: skillAttempts.filter(isCleanCheckedPracticeAttempt).length,
      hintUsedAttempts: skillAttempts.filter(function (attempt) { return attempt.usedHint; }).length
        + learningAttempts.filter(function (attempt) { return attempt && attempt.usedHint === true; }).length,
      revealedAnswerAttempts: skillAttempts.filter(function (attempt) { return attempt.revealedAnswer; }).length
        + learningAttempts.filter(function (attempt) { return attempt && attempt.revealedAnswer === true; }).length
        + examAttempts.filter(function (attempt) { return attempt && attempt.answerRevealedBeforeMarking === true; }).length,
      repairAttempts: skillAttempts.filter(function (attempt) { return attempt.revealedRepairStep; }).length,
      selfMarkedExamAttempts: examAttempts.filter(function (attempt) { return attempt && attempt.selfMarked === true; }).length,
      browserDeviceWarning: 'This record is saved only in this browser on this device. It is local evidence, not a server-verified account record.'
    };
  }

  function teacherSummaryListValue(items, emptyText) {
    if (items === undefined) return 'Not recorded in this browser';
    if (!items.length) return emptyText;
    return items.join(', ');
  }

  function teacherSummaryCountValue(count) {
    return typeof count === 'number' && Number.isFinite(count) ? String(count) : 'Not recorded in this browser';
  }

  function renderLocalProgressTeacherSummary(panel, progress) {
    var summaryNode = panel?.querySelector('[data-export-teacher-summary]');
    if (!(summaryNode instanceof HTMLElement)) return;
    var gate = document.querySelector('[data-p3-exam-review-gate]');
    var requirements = gate ? parseExamReviewRequirements(gate) : [];
    var summary = localProgressTeacherSummary(progress, requirements);
    summaryNode.innerHTML = '<dl class="teacher-progress-summary-list">'
      + '<div><dt>P3 units with clean Checked Practice pass</dt><dd>' + escapeText(teacherSummaryListValue(summary.completeUnits, 'None recorded yet')) + '</dd></div>'
      + '<div><dt>P3 units still incomplete</dt><dd>' + escapeText(teacherSummaryListValue(summary.incompleteUnits, 'None')) + '</dd></div>'
      + '<div><dt>Total clean Checked Practice passes</dt><dd>' + escapeText(teacherSummaryCountValue(summary.totalCleanPasses)) + '</dd></div>'
      + '<div><dt>Hint-used attempts</dt><dd>' + escapeText(teacherSummaryCountValue(summary.hintUsedAttempts)) + '</dd></div>'
      + '<div><dt>Revealed-answer attempts</dt><dd>' + escapeText(teacherSummaryCountValue(summary.revealedAnswerAttempts)) + '</dd></div>'
      + '<div><dt>Repair attempts</dt><dd>' + escapeText(teacherSummaryCountValue(summary.repairAttempts)) + '</dd></div>'
      + '<div><dt>Self-marked Exam Training attempts</dt><dd>' + escapeText(teacherSummaryCountValue(summary.selfMarkedExamAttempts)) + '</dd></div>'
      + '<div><dt>Browser/device warning</dt><dd>' + escapeText(summary.browserDeviceWarning) + '</dd></div>'
      + '</dl>';
  }

  function updateLocalProgressTeacherSummaries(progress) {
    var currentProgress = progress || loadProgress();
    document.querySelectorAll('[data-export-panel]').forEach(function (panel) {
      renderLocalProgressTeacherSummary(panel, currentProgress);
    });
  }

  function submissionSummaryCsvRow(progress, exportTimestamp, metadata) {
    return csvRowWithExportMetadata(Object.assign(blankCsvRow(exportTimestamp), {
      topic: 'All P3 local progress',
      route_page_type: 'export',
      activity_type: 'Submission Summary',
      item_id: metadata.submissionId,
      attempt_timestamp: metadata.submissionTimestamp,
      answer_result_summary: localProgressSummaryText(localProgressSubmissionSummary(progress)),
      deterministic_pass_fail: 'not_available',
      evidence_label: 'Student-submitted local progress export',
      evidence_status_label: 'export_metadata_only'
    }), metadata);
  }

  function skillCheckCsvRow(attempt, exportTimestamp) {
    var passed = isCleanCheckedPracticeAttempt(attempt);
    return Object.assign(blankCsvRow(exportTimestamp), {
      topic: attempt.topic || '',
      route_page_type: 'skill-check',
      activity_type: 'Checked Practice',
      item_id: attempt.checkId || '',
      attempt_timestamp: attempt.timestamp || '',
      answer_result_summary: attempt.submittedAnswer || '',
      deterministic_pass_fail: passed ? 'pass' : 'fail',
      evidence_label: passed ? 'Clean Checked Practice pass - strongest local evidence' : 'Checked Practice attempt - not a clean pass',
      evidence_status_label: passed ? 'checked_practice_passed' : 'not_passed'
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
      evidence_label: 'Review candidate from local Checked Practice attempt - not a clean pass',
      evidence_status_label: 'needs_checked_evidence',
      suspicion_flags: tags.join('|')
    });
  }

  function examCsvRow(attempt, exportTimestamp) {
    var score = typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0
      ? attempt.marksEarned + '/' + attempt.marksAvailable
      : typeof attempt.marksEarned === 'number' ? String(attempt.marksEarned) : '';
    var evidenceStatusLabel = attempt.masteryGate === 'skill_check_passed'
      ? 'checked_practice_passed_self_marked_exam_practice'
      : 'self_marked_exam_practice_only';
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
      evidence_status_label: evidenceStatusLabel,
      suspicion_flags: safeArray(attempt.suspicionFlags).join('|')
    });
  }

  function learningCsvRow(attempt, exportTimestamp) {
    var isLearnMode = attempt.activityType === 'learn_mode';
    return Object.assign(blankCsvRow(exportTimestamp), {
      topic: attempt.topic || attempt.regionId || '',
      route_page_type: isLearnMode ? 'learn' : 'field-guide',
      activity_type: isLearnMode ? 'Learn' : (attempt.activityType || 'Learn'),
      item_id: attempt.activityId || attempt.id || '',
      attempt_timestamp: attempt.completedAt || attempt.createdAt || '',
      answer_result_summary: attempt.submittedAnswer || attempt.prompt || '',
      deterministic_pass_fail: typeof attempt.isCorrect === 'boolean' ? (attempt.isCorrect ? 'pass' : 'fail') : 'not_available',
      evidence_label: 'Local learning activity',
      evidence_status_label: attempt.strongEvidence ? 'checked_learning_activity' : 'content_activity_only',
      suspicion_flags: safeArray(attempt.mistakeTags).join('|')
    });
  }

  function knowledgeStateCsvRow(update, exportTimestamp) {
    return Object.assign(blankCsvRow(exportTimestamp), {
      topic: update.skillNodeId || '',
      route_page_type: 'knowledge-state',
      activity_type: 'Skill State Update',
      item_id: update.id || '',
      attempt_timestamp: update.timestamp || '',
      answer_result_summary: String(update.previousScore) + '->' + String(update.newScore),
      deterministic_pass_fail: update.outcome || '',
      evidence_label: 'Error-to-knowledge-state transformer',
      evidence_status_label: 'state_update_metadata',
      knowledge_skill_id: update.skillNodeId || '',
      knowledge_state_score: String(update.newScore ?? ''),
      knowledge_state_category: update.newCategory || '',
      knowledge_stability_flag: update.stabilityFlag || '',
      knowledge_confidence: String(update.confidence ?? ''),
      knowledge_evidence_strength: String(update.evidenceStrength ?? '')
    });
  }

  function knowledgeErrorCsvRow(error, exportTimestamp) {
    return Object.assign(blankCsvRow(exportTimestamp), {
      topic: error.primarySkillNodeId || '',
      route_page_type: 'knowledge-state',
      activity_type: 'Error Diagnostic',
      item_id: error.id || '',
      attempt_timestamp: error.timestamp || '',
      answer_result_summary: error.markPointLabel || error.markPointId || error.errorType || '',
      evidence_label: 'Skill-linked missed mark evidence',
      evidence_status_label: 'missed_mark_evidence',
      knowledge_skill_id: error.primarySkillNodeId || '',
      knowledge_error_type: error.errorType || '',
      knowledge_error_severity: error.severity || '',
      knowledge_repeat_flag: String(Boolean(error.repeat)),
      knowledge_misconception_tag: error.misconceptionTag || '',
      knowledge_evidence_strength: String(error.evidenceStrength ?? '')
    });
  }

  function knowledgeInterventionCsvRow(intervention, schedules, exportTimestamp) {
    var schedule = safeArray(schedules).find(function (candidate) {
      return candidate.interventionId === intervention.id;
    });
    return Object.assign(blankCsvRow(exportTimestamp), {
      topic: intervention.skillNodeId || '',
      route_page_type: 'knowledge-state',
      activity_type: 'Intervention Plan',
      item_id: intervention.id || '',
      attempt_timestamp: intervention.createdAt || '',
      answer_result_summary: intervention.rationale || '',
      evidence_label: 'State-change-driven intervention',
      evidence_status_label: 'intervention_metadata',
      knowledge_skill_id: intervention.skillNodeId || '',
      knowledge_state_score: String(intervention.stateChange?.newScore ?? ''),
      knowledge_state_category: intervention.stateChange?.category || '',
      knowledge_stability_flag: intervention.stateChange?.stabilityFlag || '',
      intervention_action: intervention.action || '',
      retest_timing: schedule?.retestTiming || '',
      follow_up_item_type: schedule?.followUpItemType || '',
      follow_up_relation: schedule?.difficultyRelation || ''
    });
  }

  function buildLocalProgressCsv(progress, exportTimestamp, metadata) {
    var exportMetadata = normalizeExportMetadata(metadata, exportTimestamp);
    var skillRows = normalizeSkillCheckAttempts(progress.skillCheckAttempts).flatMap(function (attempt) {
      return [skillCheckCsvRow(attempt, exportTimestamp), reviewCsvRow(attempt, exportTimestamp)].filter(Boolean);
    });
    var examRows = safeArray(progress.attempts).map(function (attempt) {
      return examCsvRow(attempt, exportTimestamp);
    });
    var learningRows = safeArray(progress.learningActivityAttempts).map(function (attempt) {
      return learningCsvRow(attempt, exportTimestamp);
    });
    var knowledgeStateRows = safeArray(progress.knowledge_state_updates).map(function (update) {
      return knowledgeStateCsvRow(update, exportTimestamp);
    });
    var knowledgeErrorRows = safeArray(progress.knowledge_errors).map(function (error) {
      return knowledgeErrorCsvRow(error, exportTimestamp);
    });
    var knowledgeInterventionRows = safeArray(progress.knowledge_interventions).map(function (intervention) {
      return knowledgeInterventionCsvRow(intervention, progress.knowledge_schedules, exportTimestamp);
    });
    var rows = [submissionSummaryCsvRow(progress, exportTimestamp, exportMetadata)]
      .concat(skillRows, examRows, learningRows, knowledgeStateRows, knowledgeErrorRows, knowledgeInterventionRows)
      .map(function (row) {
        return csvRowWithExportMetadata(row, exportMetadata);
      });
    return [CSV_HEADERS.join(',')]
      .concat(rows)
      .map(function (row) {
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

  function progressJsonFilename(timestamp) {
    return 'asterion-progress-' + String(timestamp || new Date().toISOString()).slice(0, 10) + '.json';
  }

  function exportThemePreference() {
    var theme = safeStorageGet(THEME_STORAGE_KEY);
    return theme === 'dark' || theme === 'light' ? theme : null;
  }

  function buildProgressJsonExport() {
    var timestamp = new Date().toISOString();
    return {
      kind: PROGRESS_EXPORT_KIND,
      schemaVersion: PROGRESS_EXPORT_SCHEMA_VERSION,
      exportedAt: timestamp,
      storageKeys: [STORAGE_KEY, THEME_STORAGE_KEY],
      progressStorageKey: STORAGE_KEY,
      progress: loadProgress(),
      settings: {
        theme: exportThemePreference()
      }
    };
  }

  function progressImportError(message) {
    return { valid: false, message: message };
  }

  function validateProgressImportPayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return progressImportError('This is not a valid Asterion progress file.');
    }
    if (payload.kind !== PROGRESS_EXPORT_KIND) {
      return progressImportError('This JSON file was not exported by Asterion progress transfer.');
    }
    if (payload.schemaVersion !== PROGRESS_EXPORT_SCHEMA_VERSION) {
      return progressImportError('This progress file uses an unsupported export schema version.');
    }
    var rawProgress = payload.progress;
    if (!rawProgress || typeof rawProgress !== 'object' || Array.isArray(rawProgress)) {
      return progressImportError('This progress file is missing the progress record.');
    }
    if (typeof rawProgress.schemaVersion !== 'number' || rawProgress.schemaVersion > 1) {
      return progressImportError('This progress file uses an unsupported progress schema version.');
    }
    if (!Array.isArray(rawProgress.attempts)
      || !Array.isArray(rawProgress.learningActivityAttempts)
      || !Array.isArray(rawProgress.skillCheckAttempts)
      || !isRecord(rawProgress.regionLearning)
      || !isRecord(rawProgress.settings)) {
      return progressImportError('This progress file is malformed or incomplete.');
    }
    var theme = payload.settings && typeof payload.settings === 'object' ? payload.settings.theme : null;
    return {
      valid: true,
      progress: normalizeStoredProgress(rawProgress),
      theme: theme === 'dark' || theme === 'light' ? theme : null,
      exportedAt: typeof payload.exportedAt === 'string' ? payload.exportedAt : ''
    };
  }

  function setProgressTransferStatus(message) {
    document.querySelectorAll('[data-progress-transfer-status]').forEach(function (status) {
      status.textContent = message;
    });
  }

  function progressReplacementSummary(progress) {
    var summary = localProgressSubmissionSummary(progress);
    var lessonCount = Object.keys(progress.regionLearning || {}).reduce(function (total, regionId) {
      return total + Object.keys((progress.regionLearning[regionId] || {}).fieldGuideTopicCompletions || {}).length;
    }, 0);
    return [
      lessonCount + ' lesson completion' + (lessonCount === 1 ? '' : 's'),
      summary.checkedPracticeAttempts + ' checked attempt' + (summary.checkedPracticeAttempts === 1 ? '' : 's'),
      summary.selfMarkedExamAttempts + ' exam attempt' + (summary.selfMarkedExamAttempts === 1 ? '' : 's'),
      summary.reviewCandidates + ' review item' + (summary.reviewCandidates === 1 ? '' : 's')
    ].join(', ');
  }

  function exportProgressJsonDownload() {
    try {
      var payload = buildProgressJsonExport();
      var json = JSON.stringify(payload, null, 2);
      downloadTextFile(progressJsonFilename(payload.exportedAt), json, 'application/json;charset=utf-8');
      setProgressTransferStatus('Progress JSON downloaded.');
    } catch (_error) {
      setProgressTransferStatus('Could not export progress from this browser.');
    }
  }

  function applyImportedProgress(importData) {
    var incomingSummary = progressReplacementSummary(importData.progress);
    var currentSummary = progressReplacementSummary(loadProgress());
    var exportedAt = importData.exportedAt ? ' Exported at: ' + importData.exportedAt + '.' : '';
    var confirmed = window.confirm(
      'Importing replaces progress saved in this browser.\n\n'
      + 'Current: ' + currentSummary + '.\n'
      + 'Import: ' + incomingSummary + '.' + exportedAt + '\n\n'
      + 'Continue?'
    );
    if (!confirmed) {
      setProgressTransferStatus('Import cancelled. Existing progress was kept.');
      return;
    }
    try {
      saveProgress(importData.progress);
      if (importData.theme) {
        safeStorageSet(THEME_STORAGE_KEY, importData.theme);
        applyThemePreference(importData.theme);
      }
      updateProgressText();
      renderReviewPage();
      setupProgressExportForms();
      setProgressTransferStatus('Progress imported.');
    } catch (_error) {
      setProgressTransferStatus('Could not save imported progress in this browser.');
    }
  }

  function importProgressJsonFile(file) {
    var reader = new FileReader();
    reader.addEventListener('load', function () {
      try {
        var parsed = JSON.parse(String(reader.result || ''));
        var validation = validateProgressImportPayload(parsed);
        if (!validation.valid) {
          setProgressTransferStatus(validation.message);
          window.alert(validation.message);
          return;
        }
        applyImportedProgress(validation);
      } catch (_error) {
        var message = 'This progress file is malformed JSON.';
        setProgressTransferStatus(message);
        window.alert(message);
      }
    });
    reader.addEventListener('error', function () {
      setProgressTransferStatus('Could not read the selected progress file.');
    });
    reader.readAsText(file);
  }

  function setupProgressTransferControls() {
    var controls = document.querySelector('[data-progress-transfer-controls]');
    if (!controls) return;
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.hidden = true;
    input.setAttribute('data-import-progress-file-input', '');
    controls.append(input);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      importProgressJsonFile(file);
    });
  }

  function defaultReportingPeriod(date) {
    var current = date ? new Date(date) : new Date();
    var day = current.getDay();
    var offset = day === 0 ? -6 : 1 - day;
    var monday = new Date(current);
    monday.setDate(current.getDate() + offset);
    return 'Week of ' + monday.toISOString().slice(0, 10);
  }

  function localProgressEmailBody(metadata, summary, csv, includeCsv) {
    var lines = [
      'Asterion local progress export',
      '',
      'Student: ' + metadata.studentName,
      'Class/group: ' + metadata.classGroup,
      'Reporting period: ' + metadata.reportingPeriod,
      'Submission timestamp: ' + metadata.submissionTimestamp,
      'Submission ID: ' + metadata.submissionId,
      '',
      'Summary:',
      localProgressSummaryText(summary),
      '',
      'Notes:',
      'This export is generated from progress saved in this browser only.',
      'Your teacher should treat clean Checked Practice passes as the strongest evidence. Self-marked exam attempts are practice records only.'
    ];
    if (includeCsv) {
      lines = lines.concat([
        '',
        'CSV:',
        csv
      ]);
    } else {
      lines = lines.concat([
        '',
      'The CSV is too large for a reliable prefilled email body. Please paste the CSV copied from the Asterion page below this message.'
      ]);
    }
    return lines.join('\n');
  }

  function progressMailtoHref(metadata, summary, csv) {
    var subject = 'Asterion progress - ' + metadata.studentName + ' - ' + metadata.reportingPeriod;
    var bodyWithCsv = localProgressEmailBody(metadata, summary, csv, true);
    var hrefWithCsv = 'mailto:' + encodeURIComponent(metadata.teacherEmail)
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(bodyWithCsv);
    if (hrefWithCsv.length <= MAILTO_PROGRESS_EXPORT_MAX_LENGTH) return { href: hrefWithCsv, includesCsv: true };
    var bodyWithoutCsv = localProgressEmailBody(metadata, summary, csv, false);
    return {
      href: 'mailto:' + encodeURIComponent(metadata.teacherEmail)
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(bodyWithoutCsv),
      includesCsv: false
    };
  }

  function setExportStatus(panel, message) {
    var status = panel?.querySelector('[data-export-status]');
    if (status) status.textContent = message;
  }

  function showExportCsvFallback(panel, csv, shouldShow) {
    var fallback = panel?.querySelector('[data-export-fallback]');
    var csvOutput = panel?.querySelector('[data-export-csv-output]');
    if (fallback instanceof HTMLElement) fallback.hidden = !shouldShow;
    if (csvOutput instanceof HTMLTextAreaElement) csvOutput.value = shouldShow ? csv : '';
  }

  function exportLocalProgressData(form) {
    var progress = loadProgress();
    var timestamp = new Date().toISOString();
    var data = new FormData(form);
    var metadata = normalizeExportMetadata({
      submissionId: createId('progress_export'),
      studentName: data.get('studentName'),
      classGroup: data.get('classGroup'),
      teacherEmail: data.get('teacherEmail'),
      reportingPeriod: data.get('reportingPeriod') || defaultReportingPeriod(timestamp),
      submissionTimestamp: timestamp
    }, timestamp);
    progress.exportProfile = {
      studentName: metadata.studentName,
      classGroup: metadata.classGroup,
      teacherEmail: metadata.teacherEmail,
      reportingPeriod: metadata.reportingPeriod,
      lastSubmissionId: metadata.submissionId,
      lastSubmissionTimestamp: metadata.submissionTimestamp
    };
    saveProgress(progress);
    var csv = buildLocalProgressCsv(progress, timestamp, metadata);
    var summary = localProgressSubmissionSummary(progress);
    return {
      progress: progress,
      timestamp: timestamp,
      metadata: metadata,
      csv: csv,
      summary: summary,
      panel: form.closest('[data-export-panel]'),
      rowCount: Math.max(0, csv.split('\n').length - 1)
    };
  }

  function exportCsvFilename(metadata) {
    var student = String(metadata.studentName || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'student';
    var date = String(metadata.submissionTimestamp || new Date().toISOString()).slice(0, 10);
    return 'asterion-progress-' + student + '-' + date + '.csv';
  }

  function exportLocalProgressDownload(form) {
    if (!form.reportValidity()) return;
    var exportData = exportLocalProgressData(form);
    showExportCsvFallback(exportData.panel, exportData.csv, true);
    downloadTextFile(exportCsvFilename(exportData.metadata), exportData.csv, 'text/csv;charset=utf-8');
    setExportStatus(
      exportData.panel,
      'Downloaded ' + exportData.rowCount + ' CSV row' + (exportData.rowCount === 1 ? '' : 's') + '. Attach the CSV to your own email or upload it where your teacher asked.'
    );
    updateLocalProgressTeacherSummaries(exportData.progress);
  }

  function exportLocalProgressEmail(form) {
    var exportData = exportLocalProgressData(form);
    var csv = exportData.csv;
    var summary = exportData.summary;
    var metadata = exportData.metadata;
    var mailto = progressMailtoHref(metadata, summary, csv);
    var panel = exportData.panel;
    var rowCount = exportData.rowCount;
    showExportCsvFallback(panel, csv, !mailto.includesCsv);
    setExportStatus(
      panel,
      mailto.includesCsv
        ? 'Email message prepared with ' + rowCount + ' CSV row' + (rowCount === 1 ? '' : 's') + ' in the message body.'
        : 'Email message prepared. The CSV is too large for a reliable email body, so download or copy the CSV shown below.'
    );
    updateLocalProgressTeacherSummaries(exportData.progress);
    window.location.href = mailto.href;
  }

  function setupProgressExportForms() {
    document.querySelectorAll('[data-export-local-progress-form]').forEach(function (form) {
      if (!(form instanceof HTMLFormElement)) return;
      var progress = loadProgress();
      var profile = progress.exportProfile && typeof progress.exportProfile === 'object' ? progress.exportProfile : {};
      var studentName = form.elements.namedItem('studentName');
      var classGroup = form.elements.namedItem('classGroup');
      var teacherEmail = form.elements.namedItem('teacherEmail');
      var reportingPeriod = form.elements.namedItem('reportingPeriod');
      if (studentName instanceof HTMLInputElement && !studentName.value) studentName.value = profile.studentName || '';
      if (classGroup instanceof HTMLInputElement && !classGroup.value) classGroup.value = profile.classGroup || '';
      if (teacherEmail instanceof HTMLInputElement && !teacherEmail.value) teacherEmail.value = profile.teacherEmail || '';
      if (reportingPeriod instanceof HTMLInputElement && !reportingPeriod.value) {
        reportingPeriod.value = profile.reportingPeriod || defaultReportingPeriod();
      }
    });
    updateLocalProgressTeacherSummaries();
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

  function isCleanCheckedPracticeAttempt(attempt) {
    return Boolean(isSkillCheckAttemptRecord(attempt) && attempt.isCorrect && !attempt.usedHint && !attempt.revealedAnswer && !attempt.revealedRepairStep);
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

  function cleanPassedCheckIds(progress, requiredCheckIds, regionId) {
    return requiredCheckIds.filter(function (checkId) {
      return progress.skillCheckAttempts.some(function (attempt) {
        return attempt.regionId === regionId && attempt.checkId === checkId && isCleanCheckedPracticeAttempt(attempt);
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
      return 'Self-marked exam practice - review with your teacher';
    }
    return flags.length ? 'Self-marked exam practice - review with your teacher' : 'Self-marked exam practice';
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
      complete: requiredCheckIds.length > 0 && passCount >= requiredCheckIds.length
    };
  }

  function teacherExamReviewRequirementStatus(progress, requirement) {
    var fieldGuideTotal = Math.max(1, Number(requirement.fieldGuideTotal || 1));
    var guideCount = fieldGuideCompletedCount(progress, requirement.regionId, fieldGuideTotal);
    var requiredCheckIds = requirement.requiredCheckIds.filter(function (id) { return typeof id === 'string' && id; });
    var passCount = cleanPassedCheckIds(progress, requiredCheckIds, requirement.regionId).length;
    return {
      guideCount: guideCount,
      fieldGuideTotal: fieldGuideTotal,
      passCount: passCount,
      requiredCheckCount: requiredCheckIds.length,
      complete: requiredCheckIds.length > 0 && passCount >= requiredCheckIds.length
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
          ? 'All P3 units have checked evidence in this browser. Mixed exam review is open.'
          : completed + '/' + requirements.length + ' units have checked evidence. Finish the remaining checked questions first.';
      }
      if (list) {
        list.innerHTML = statuses.map(function (status) {
          var requirement = status.requirement;
          var targetHref = requirement.skillCheckHref;
          return '<li class="' + (status.complete ? 'is-complete' : 'is-incomplete') + '">'
            + '<div><strong>' + escapeText(requirement.name) + '</strong>'
            + '<span>Checked questions ' + status.passCount + '/' + status.requiredCheckCount
            + '; optional Learn ' + status.guideCount + '/' + status.fieldGuideTotal + '</span></div>'
            + (status.complete ? '<span class="unit-state">Checked evidence</span>' : '<a class="text-link" href="' + escapeText(targetHref || '#') + '">Continue</a>')
            + '</li>';
        }).join('');
      }
    });
  }

  function unitProgressFromCard(progress, card) {
    var regionId = card.getAttribute('data-path-unit') || '';
    var name = card.getAttribute('data-unit-name') || card.querySelector('h2')?.textContent || 'this unit';
    var unitLabel = card.getAttribute('data-unit-label') || '';
    var learnHref = card.getAttribute('data-learn-href') || card.getAttribute('href') || '#';
    var skillHref = card.getAttribute('data-skill-href') || learnHref;
    var examHref = card.getAttribute('data-exam-href') || learnHref;
    var guideNode = card.querySelector('[data-progress-field-guide]');
    var skillNode = card.querySelector('[data-progress-skill]');
    var fieldTotal = Number(guideNode?.getAttribute('data-total') || 1);
    var guideCount = fieldGuideCompletedCount(progress, regionId, fieldTotal);
    var requiredCheckIds = skillNode ? parseRequiredCheckIds(skillNode) : [];
    var passCount = requiredCheckIds.length
      ? passedCheckIds(progress, requiredCheckIds, regionId).length
      : passingSkillAttemptsForRegion(progress, regionId).length;
    var examCount = attemptsForRegion(progress, regionId).length;
    var checkedComplete = requiredCheckIds.length > 0 && passCount >= requiredCheckIds.length;
    return {
      card: card,
      name: name,
      unitLabel: unitLabel,
      learnHref: learnHref,
      skillHref: skillHref,
      examHref: examHref,
      guideCount: guideCount,
      fieldTotal: fieldTotal,
      passCount: passCount,
      requiredCheckCount: requiredCheckIds.length,
      examCount: examCount,
      checkedComplete: checkedComplete,
      reviewReady: checkedComplete,
      started: guideCount > 0 || passCount > 0 || examCount > 0
    };
  }

  function actionForUnitStatus(status) {
    if (status.passCount > 0 && !status.checkedComplete) {
      return {
        title: 'Continue ' + status.name + ' Checked Practice',
        copy: 'You have already started Checked Practice for this unit. Learn remains available if you need support.',
        href: status.skillHref,
        label: 'Continue Checked Practice'
      };
    }
    if (status.guideCount < status.fieldTotal) {
      return {
        title: (status.guideCount > 0 ? 'Continue ' : 'Start ') + status.name + ' Learn',
        copy: 'Default path: Diagnostic \u2192 Learn \u2192 Checked Practice \u2192 Exam Training. Confident students can still try Checked Practice now.',
        href: status.learnHref,
        label: (status.guideCount > 0 ? 'Continue ' : 'Start ') + status.name + ' Learn'
      };
    }
    if (!status.checkedComplete) {
      return {
        title: (status.started ? 'Continue ' : 'Start ') + status.name + ' Checked Practice',
        copy: 'Learn is complete for this unit. Checked passes are ' + status.passCount + '/' + status.requiredCheckCount + '.',
        href: status.skillHref,
        label: status.started ? 'Continue Checked Practice' : 'Start Checked Practice'
      };
    }
    return {
      title: 'Try ' + status.name + ' Exam Training',
      copy: 'A clean Checked Practice pass is the strongest local evidence. Exam Training is self-marked practice.',
      href: status.examHref,
      label: status.examCount > 0 ? 'Continue Exam Training' : 'Start Exam Training'
    };
  }

  function updateP3NextStepPanels(progress) {
    var panels = Array.from(document.querySelectorAll('[data-p3-next-step-panel]'));
    if (!panels.length) return;
    var statuses = Array.from(document.querySelectorAll('[data-path-unit]')).map(function (card) {
      return unitProgressFromCard(progress, card);
    });
    if (!statuses.length) return;
    var allReviewReady = statuses.every(function (status) { return status.reviewReady; });
    var hasDiagnosticReport = safeArray(progress.diagnosticReports).length > 0;
    var hasAnyStartedUnit = statuses.some(function (status) { return status.started; });
    var startedIncomplete = statuses.find(function (status) { return status.started && !status.reviewReady; });
    var checkedReadyForExam = statuses.find(function (status) { return status.reviewReady && status.examCount === 0; });
    var firstIncomplete = statuses.find(function (status) { return !status.reviewReady; });
    var selected = allReviewReady ? null : (startedIncomplete || checkedReadyForExam || firstIncomplete || statuses[0]);
    var action = selected ? actionForUnitStatus(selected) : null;

    statuses.forEach(function (status) {
      var cardAction = actionForUnitStatus(status);
      var cardLink = status.card.querySelector('[data-path-unit-primary-action]');
      var fastLaneLink = status.card.querySelector('[data-path-unit-fast-lane-action]');
      status.card.classList.toggle('is-current-local-step', Boolean(selected && status.card === selected.card));
      status.card.classList.toggle('is-complete', status.reviewReady);
      status.card.classList.toggle('has-exam-evidence', status.examCount > 0);
      if (cardLink && cardAction) {
        cardLink.textContent = cardAction.label;
        cardLink.setAttribute('href', cardAction.href);
        cardLink.setAttribute('aria-label', cardAction.title);
      }
      if (fastLaneLink) {
        fastLaneLink.setAttribute('href', status.skillHref);
      }
    });

    panels.forEach(function (panel) {
      var title = panel.querySelector('[data-p3-next-step-title]');
      var copy = panel.querySelector('[data-p3-next-step-copy]');
      var link = panel.querySelector('[data-p3-next-step-link]');
      var fastLaneLink = panel.querySelector('[data-p3-fast-lane-link]');
      if (!hasDiagnosticReport && !hasAnyStartedUnit) {
        var diagnosticHref = panel.getAttribute('data-diagnostic-href') || '#';
        if (title) title.textContent = 'Start diagnostic';
        if (copy) copy.textContent = 'The summer homework path starts with the diagnostic, then Learn \u2192 Checked Practice \u2192 Exam Training.';
        if (link) {
          link.textContent = 'Start diagnostic';
          link.setAttribute('href', diagnosticHref);
        }
        if (fastLaneLink && selected) {
          fastLaneLink.hidden = false;
          fastLaneLink.textContent = 'Already completed it? Start ' + selected.name + ' Learn';
          fastLaneLink.setAttribute('href', selected.learnHref);
        }
        return;
      }
      if (allReviewReady) {
        var reviewHref = panel.getAttribute('data-review-href') || '#';
        if (title) title.textContent = 'Export progress';
        if (copy) copy.textContent = 'All unit Learn and Checked Practice progress is recorded in this browser. Clean Checked Practice passes are the strongest local evidence.';
        if (link) {
          link.textContent = 'Export Progress';
          link.setAttribute('href', reviewHref);
        }
        if (fastLaneLink) fastLaneLink.hidden = true;
        return;
      }
      if (!action) return;
      if (title) title.textContent = action.title;
      if (copy) copy.textContent = action.copy;
      if (link) {
        link.textContent = action.label || 'Continue current topic';
        link.setAttribute('href', action.href);
      }
      if (fastLaneLink && selected) {
        fastLaneLink.hidden = false;
        fastLaneLink.textContent = 'Already confident? Try Checked Practice';
        fastLaneLink.setAttribute('href', selected.skillHref);
      }
    });
  }

  function updateProgressText() {
    var progress = loadProgress();
    document.querySelectorAll('[data-progress-field-guide]').forEach(function (node) {
      var regionId = node.getAttribute('data-progress-field-guide') || '';
      var total = Number(node.getAttribute('data-total') || 1);
      var label = node.getAttribute('data-label') || 'Learn';
      var completed = fieldGuideCompletedCount(progress, regionId, total);
      node.textContent = label + ': ' + completed + '/' + total;
      node.classList.toggle('is-complete', completed >= total);
    });

    document.querySelectorAll('[data-progress-skill]').forEach(function (node) {
      var regionId = node.getAttribute('data-progress-skill') || '';
      var label = node.getAttribute('data-label') || 'Checked Practice';
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
      var label = node.getAttribute('data-label') || 'Exam practice';
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
      node.textContent = 'Local progress: ' + guideCount + '/' + fieldTotal + ' Learn steps, ' + practiceCount + ' clean Checked Practice passes, ' + examCount + ' self-marked exam practice records.';
    });

    document.querySelectorAll('[data-progress-summary]').forEach(function (node) {
      var regionId = node.getAttribute('data-progress-summary') || '';
      var fieldTotal = Number(node.getAttribute('data-field-total') || 1);
      var guideCount = fieldGuideCompletedCount(progress, regionId, fieldTotal);
      var practiceCount = passingSkillAttemptsForRegion(progress, regionId).length;
      var examCount = attemptsForRegion(progress, regionId).length;
      var parts = [];
      if (guideCount > 0) parts.push(guideCount + '/' + fieldTotal + ' Learn');
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
    renderAttemptHistorySections(progress);
    updateExamReviewGate(progress);
    updateP3NextStepPanels(progress);
    updateP1RepairLaneStatus(progress);
    updateLocalProgressTeacherSummaries(progress);
    applyP1RepairP3Locks(progress);
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
      var id = card.getAttribute('data-learn-step-id') || '';
      var legacyId = card.getAttribute('data-field-guide-topic') || '';
      return Boolean(completions[id] || completions[legacyId]);
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

  function learnCardCompleted(progress, card) {
    var regionId = card.getAttribute('data-region-id') || '';
    var stepId = card.getAttribute('data-learn-step-id') || '';
    var legacyId = card.getAttribute('data-field-guide-topic') || '';
    return Boolean(learnStepCompleted(progress, regionId, stepId) || learnStepCompleted(progress, regionId, legacyId));
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
      .replace(/\\frac\s*\{\s*\\sqrt\s*\{([^{}]+)\}\s*\}\s*\{([^{}]+)\}/g, 'sqrt($1)/$2')
      .replace(/\\frac\s*\{([^{}]+)\}\s*\{\s*\\sqrt\s*\{([^{}]+)\}\s*\}/g, '$1/sqrt($2)')
      .replace(/\\pi\b/g, 'pi')
      .replace(/\\sqrt\s*\{([^{}]+)\}/g, 'sqrt($1)')
      .replace(/\\sqrt\s*([+-]?\d+(?:\.\d+)?)/g, 'sqrt($1)')
      .replace(/\bsqrt\s*([+-]?\d+(?:\.\d+)?)/gi, 'sqrt($1)')
      .replace(/√\s*([+-]?\d+(?:\.\d+)?)/g, 'sqrt($1)')
      .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2')
      .replace(/\\cdot|\\times/g, '*')
      .replace(/÷/g, '/')
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

  function parseDecimalNumber(value) {
    return /^[+-]?\d+(?:\.\d+)?$/.test(value) ? Number(value) : undefined;
  }

  function parseRadicalNumber(value) {
    var radical = value.match(/^([+-]?)(?:(\d+(?:\.\d+)?)\*?)?sqrt\(([+-]?\d+(?:\.\d+)?)\)$/);
    if (!radical) return undefined;
    var sign = radical[1] === '-' ? -1 : 1;
    var coefficient = radical[2] === undefined ? 1 : Number(radical[2]);
    var radicand = Number(radical[3]);
    if (!Number.isFinite(coefficient) || !Number.isFinite(radicand) || radicand < 0) return undefined;
    return sign * coefficient * Math.sqrt(radicand);
  }

  function parsePiNumber(value) {
    var pi = value.match(/^([+-]?)(?:(\d+(?:\.\d+)?)\*?)?pi$/);
    if (!pi) return undefined;
    var sign = pi[1] === '-' ? -1 : 1;
    var coefficient = pi[2] === undefined ? 1 : Number(pi[2]);
    if (!Number.isFinite(coefficient)) return undefined;
    return sign * coefficient * Math.PI;
  }

  function parseNumericAtom(value) {
    var decimal = parseDecimalNumber(value);
    if (decimal !== undefined) return decimal;
    var radical = parseRadicalNumber(value);
    return radical === undefined ? parsePiNumber(value) : radical;
  }

  function parseSimpleNumber(value) {
    var compact = compactAnswerText(afterEquals(value)).replace(/^\+/, '');
    if (!compact) return undefined;
    var direct = parseNumericAtom(compact);
    if (direct !== undefined) return direct;
    var fraction = compact.match(/^(.+)\/(.+)$/);
    if (!fraction) return undefined;
    var numerator = parseNumericAtom(fraction[1]);
    var denominator = parseNumericAtom(fraction[2]);
    if (numerator === undefined || denominator === undefined || denominator === 0) return undefined;
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

  function hasBalancedOuterParentheses(value) {
    if (!value.startsWith('(') || !value.endsWith(')')) return false;
    var depth = 0;
    for (var index = 0; index < value.length; index += 1) {
      var character = value[index];
      if (character === '(') depth += 1;
      if (character === ')') depth -= 1;
      if (depth === 0 && index < value.length - 1) return false;
      if (depth < 0) return false;
    }
    return depth === 0;
  }

  function stripBalancedOuterParentheses(value) {
    var current = value;
    while (hasBalancedOuterParentheses(current)) {
      current = current.slice(1, -1);
    }
    return current;
  }

  function normalizeFunctionNotation(value) {
    var current = value;
    var previous = '';
    while (current !== previous) {
      previous = current;
      current = current.replace(/\\?(sin|cos|tan|sec|cosec|cot|ln)\(([^()+\-*/^,=]+)\)/g, '$1$2');
    }
    return current;
  }

  function normalizeExpressionText(value) {
    return stripBalancedOuterParentheses(normalizeFunctionNotation(compactAnswerText(value)))
      .replace(/\*/g, '')
      .replace(/^\(([-+]?(?:\d+(?:\.\d+)?|\d*\.\d+)(?:\/[-+]?\d+(?:\.\d+)?)?)\)(?=\()/, '$1')
      .replace(/^\((\([^()]+\)\^\d+)\)(?=\/)/, '$1')
      .replace(/\(([-+]?\d*[a-z](?:\^\d+)?)\)(?=\/)/g, '$1')
      .replace(/\^1(?!\d)/g, '');
  }

  function normalizeExpressionTextVariants(value) {
    var variants = [normalizeExpressionText(value)];
    var rightSide = afterEquals(value);
    if (rightSide !== value) variants.push(normalizeExpressionText(rightSide));
    return Array.from(new Set(variants));
  }

  function splitTopLevelValues(value) {
    return normalizeMathText(value)
      .replace(/\b(?:or|and)\b/gi, ',')
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
    var match = normalizeMathText(value).match(/^[([{<⟨]?\s*([^,()[\]{}<>⟨⟩]+)\s*,\s*([^,()[\]{}<>⟨⟩]+)(?:\s*,\s*([^,()[\]{}<>⟨⟩]+))?\s*[)\]}>⟩]?$/);
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

  function parseIntervalEndpoint(value) {
    var compact = compactAnswerText(value);
    if (/^[+-]?(?:inf|infinity|∞)$/.test(compact)) return compact.startsWith('-') ? -Infinity : Infinity;
    return parseSimpleNumber(value);
  }

  function parseInterval(value) {
    var normalized = normalizeMathText(value).trim();
    var compact = normalized.replace(/\s+/g, '');
    var notation = compact.match(/^([\[(])([^,]+),([^\])]+)([\]\)])$/);
    if (notation) {
      var notationLower = parseIntervalEndpoint(notation[2]);
      var notationUpper = parseIntervalEndpoint(notation[3]);
      if (notationLower === undefined || notationUpper === undefined || notationLower > notationUpper) return undefined;
      return {
        lower: notationLower,
        upper: notationUpper,
        lowerInclusive: notation[1] === '[',
        upperInclusive: notation[4] === ']'
      };
    }
    var lowerHalfLine = compact.match(/^([a-z])(?:>=|>)(.+)$/i);
    if (lowerHalfLine && !compact.includes('and')) {
      var halfLineLower = parseSimpleNumber(lowerHalfLine[2]);
      if (halfLineLower === undefined) return undefined;
      return {
        lower: halfLineLower,
        upper: Infinity,
        lowerInclusive: compact.includes('>='),
        upperInclusive: false
      };
    }
    var upperHalfLine = compact.match(/^([a-z])(?:<=|<)(.+)$/i);
    if (upperHalfLine && !compact.includes('and')) {
      var halfLineUpper = parseSimpleNumber(upperHalfLine[2]);
      if (halfLineUpper === undefined) return undefined;
      return {
        lower: -Infinity,
        upper: halfLineUpper,
        lowerInclusive: false,
        upperInclusive: compact.includes('<=')
      };
    }
    var reverseHalfLine = compact.match(/^(.+?)(<=|>=|<|>)([a-z])$/i);
    if (reverseHalfLine) {
      var reverseEndpoint = parseSimpleNumber(reverseHalfLine[1]);
      if (reverseEndpoint === undefined) return undefined;
      if (reverseHalfLine[2] === '<' || reverseHalfLine[2] === '<=') {
        return {
          lower: reverseEndpoint,
          upper: Infinity,
          lowerInclusive: reverseHalfLine[2] === '<=',
          upperInclusive: false
        };
      }
      return {
        lower: -Infinity,
        upper: reverseEndpoint,
        lowerInclusive: false,
        upperInclusive: reverseHalfLine[2] === '>='
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

  function endpointsEqual(left, right, tolerance) {
    if (!Number.isFinite(left) || !Number.isFinite(right)) return left === right;
    return numbersEqual(left, right, tolerance);
  }

  function intervalsEqual(left, right, tolerance) {
    return endpointsEqual(left.lower, right.lower, tolerance)
      && endpointsEqual(left.upper, right.upper, tolerance)
      && left.lowerInclusive === right.lowerInclusive
      && left.upperInclusive === right.upperInclusive;
  }

  function intervalEndpointLabel(value) {
    if (value === Infinity) return 'infinity';
    if (value === -Infinity) return '-infinity';
    return numericLabel(value);
  }

  function normalizeInterval(value) {
    return (value.lowerInclusive ? '[' : '(') + intervalEndpointLabel(value.lower) + ', ' + intervalEndpointLabel(value.upper) + (value.upperInclusive ? ']' : ')');
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
      var submittedExpressionVariants = normalizeExpressionTextVariants(trimmed);
      var expression = submittedExpressionVariants[0];
      match = spec.acceptedAnswers.find(function (accepted) {
        var acceptedExpressionVariants = normalizeExpressionTextVariants(accepted);
        return submittedExpressionVariants.some(function (submitted) {
          return acceptedExpressionVariants.includes(submitted);
        });
      });
      return skillCheckResult(spec, { isCorrect: Boolean(match), normalizedSubmittedAnswer: expression, matchedAcceptedAnswer: match, reason: match ? 'Matched normalized expression text.' : 'Expression did not match an accepted normalized text form. Algebraic equivalence is not inferred.', unsupported: false });
    }
    if (spec.answerType === 'numeric') {
      var submittedNumber = parseSimpleNumber(trimmed);
      if (submittedNumber === undefined) return skillCheckResult(spec, { isCorrect: false, normalizedSubmittedAnswer: compactAnswerText(trimmed), reason: 'Submitted answer is not a supported integer, decimal, simple fraction, simple radical, or simple pi form.', unsupported: false });
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

  var P3_DIAGNOSTIC_SECTION_IDS = ['algebra_foundation', 'p3_transition', 'problem_solving'];
  var P3_DIAGNOSTIC_RISK_FLAGS = [
    'ALGEBRA_WEAK',
    'TRIG_WEAK',
    'LOGS_WEAK',
    'DIFF_WEAK',
    'INTEGRATION_WEAK',
    'VECTOR_WEAK',
    'COMPLEX_WEAK'
  ];
  var P3_DIAGNOSTIC_REPAIR_MODULES = {
    ALGEBRA_WEAK: 'P1 algebra fluency repair',
    TRIG_WEAK: 'P3 trigonometry transition repair',
    LOGS_WEAK: 'P3 logarithms and exponentials transition repair',
    DIFF_WEAK: 'P3 differentiation basics repair',
    INTEGRATION_WEAK: 'P3 integration recognition repair',
    VECTOR_WEAK: 'P3 vectors interpretation repair',
    COMPLEX_WEAK: 'P3 complex numbers interpretation repair'
  };
  var P3_DIAGNOSTIC_SECTION_LABELS = {
    algebra_foundation: 'Core algebra fluency',
    p3_transition: 'Early P3 transition skills',
    problem_solving: 'Mixed problem solving'
  };
  var P3_DIAGNOSTIC_RISK_LABELS = {
    ALGEBRA_WEAK: 'Algebra manipulation',
    TRIG_WEAK: 'Trigonometry',
    LOGS_WEAK: 'Logarithms and exponentials',
    DIFF_WEAK: 'Differentiation',
    INTEGRATION_WEAK: 'Integration',
    VECTOR_WEAK: 'Vectors',
    COMPLEX_WEAK: 'Complex numbers'
  };
  var P3_DIAGNOSTIC_PATH_COPY = {
    P1_REPAIR_REQUIRED: 'Start with foundation repair. This protects you from being pushed into P3 questions before the algebra base is steady.',
    FULL_P3_PATH: 'Use the full P3 route. You have enough foundation to start, and the weak areas below should be repaired alongside the units.',
    ACCELERATED_P3_PATH: 'Use the accelerated route. Keep checking the listed weak areas, but you can move into harder topic practice sooner.'
  };
  var P3_DIAGNOSTIC_CONFIDENCE_CHECKS = {
    ALGEBRA_WEAK: [
      { area: 'Algebra', prompt: 'Simplify 2x + 3x.', answer: '5x', why: 'Collect like terms only.' },
      { area: 'Algebra', prompt: 'Solve x + 4 = 9.', answer: 'x = 5', why: 'Subtract 4 from both sides.' },
      { area: 'Algebra', prompt: 'Expand 3(x + 2).', answer: '3x + 6', why: 'Multiply both terms inside the bracket.' }
    ],
    TRIG_WEAK: [
      { area: 'Trigonometry', prompt: 'Complete the identity: sin^2 x + cos^2 x = ?', answer: '1', why: 'This is the core Pythagorean identity.' },
      { area: 'Trigonometry', prompt: 'For 0 <= x <= 2pi, one solution of sin x = 0 is?', answer: 'x = 0', why: 'The sine graph starts at zero.' }
    ],
    LOGS_WEAK: [
      { area: 'Logs', prompt: 'Simplify log_a 3 + log_a 2.', answer: 'log_a 6', why: 'Addition of logs multiplies the arguments.' },
      { area: 'Logs', prompt: 'If e^x = e^4, then x = ?', answer: '4', why: 'Matching bases give matching powers.' }
    ],
    DIFF_WEAK: [
      { area: 'Differentiation', prompt: 'Differentiate y = x^3.', answer: 'dy/dx = 3x^2', why: 'Bring the power down, then reduce the power by 1.' },
      { area: 'Differentiation', prompt: 'Differentiate y = 5x.', answer: 'dy/dx = 5', why: 'The gradient of a linear term ax is a.' }
    ],
    INTEGRATION_WEAK: [
      { area: 'Integration', prompt: 'Integrate 4x with respect to x.', answer: '2x^2 + C', why: 'Raise the power to 2, then divide by 2.' },
      { area: 'Integration', prompt: 'Integrate 3 with respect to x.', answer: '3x + C', why: 'A constant integrates to constant times x.' }
    ],
    VECTOR_WEAK: [
      { area: 'Vectors', prompt: 'A(1, 2), B(4, 2). Find AB.', answer: '(3, 0)', why: 'Subtract A from B component by component.' },
      { area: 'Vectors', prompt: 'Find the magnitude of (3, 4).', answer: '5', why: 'Use sqrt(3^2 + 4^2).' }
    ]
  };
  var P1_REPAIR_LOCK_MESSAGE = 'P3 readiness recommendation: complete foundation review modules before continuing.';
  var P1_REPAIR_SKILL_TAGS = [
    'ALGEBRA_MANIPULATION',
    'EQUATION_SOLVING',
    'TRIG_BASIC',
    'DIFFERENTIATION_BASIC',
    'INTEGRATION_BASIC'
  ];
  var P1_REPAIR_MODULE_TITLES = [
    'Algebra Manipulation',
    'Equation Solving',
    'Trigonometry Basics',
    'Differentiation Basics',
    'Integration Basics'
  ];
  var P1_REPAIR_MODULES = [
    { module_id: 'p1-repair-algebra-manipulation', weak_skill_tags: ['ALGEBRA_MANIPULATION'] },
    { module_id: 'p1-repair-equation-solving', weak_skill_tags: ['EQUATION_SOLVING'] },
    { module_id: 'p1-repair-trig-basics', weak_skill_tags: ['TRIG_BASIC'] },
    { module_id: 'p1-repair-differentiation-basics', weak_skill_tags: ['DIFFERENTIATION_BASIC'] },
    { module_id: 'p1-repair-integration-basics', weak_skill_tags: ['INTEGRATION_BASIC'] }
  ];

  function percentScore(earned, available) {
    return available > 0 ? Math.round((earned / available) * 100) : 0;
  }

  function diagnosticSpecFromInput(input) {
    var toleranceText = input.getAttribute('data-tolerance') || '';
    var tolerance = toleranceText === '' ? NaN : Number(toleranceText);
    return {
      answerType: input.getAttribute('data-answer-type') || '',
      acceptedAnswers: parseJsonAttribute(input, 'data-accepted-answers', []),
      tolerance: Number.isFinite(tolerance) ? tolerance : undefined,
      orderMatters: input.getAttribute('data-order-matters') === 'true'
    };
  }

  function emptyDiagnosticSectionScores() {
    return P3_DIAGNOSTIC_SECTION_IDS.reduce(function (scores, sectionId) {
      scores[sectionId] = { earned: 0, available: 0 };
      return scores;
    }, {});
  }

  function emptyDiagnosticRiskScores() {
    return P3_DIAGNOSTIC_RISK_FLAGS.reduce(function (scores, flag) {
      scores[flag] = { earned: 0, available: 0 };
      return scores;
    }, {});
  }

  function diagnosticUnlockPermissions(recommendedPath) {
    if (recommendedPath === 'P1_REPAIR_REQUIRED') {
      return {
        field_guide: false,
        skill_checks: false,
        exam_training: false,
        topic_exam_strips: false,
        mocks: false
      };
    }
    if (recommendedPath === 'ACCELERATED_P3_PATH') {
      return {
        field_guide: true,
        skill_checks: true,
        exam_training: true,
        topic_exam_strips: true,
        mocks: false
      };
    }
    return {
      field_guide: true,
      skill_checks: true,
      exam_training: true,
      topic_exam_strips: false,
      mocks: false
    };
  }

  function questionCodeFromCard(card) {
    var eyebrow = card?.querySelector('.eyebrow')?.textContent || '';
    return eyebrow.split('·')[0].trim();
  }

  function collectP3DiagnosticEvaluation(form) {
    var sectionScores = emptyDiagnosticSectionScores();
    var riskScores = emptyDiagnosticRiskScores();
    var questionScores = {};
    var questionOrder = [];
    var markResults = [];
    var criticalFoundationFailed = false;
    var marksEarned = 0;
    var marksAvailable = 0;

    form.querySelectorAll('[data-diagnostic-question]').forEach(function (card) {
      var questionId = card.getAttribute('data-diagnostic-question') || '';
      if (!questionId) return;
      questionOrder.push(questionId);
      questionScores[questionId] = {
        questionId: questionId,
        code: questionCodeFromCard(card),
        title: card.querySelector('h3')?.textContent?.trim() || questionId,
        sectionId: card.closest('[data-diagnostic-section]')?.getAttribute('data-diagnostic-section') || '',
        earned: 0,
        available: 0,
        missedMarkLabels: []
      };
    });

    form.querySelectorAll('[data-diagnostic-mark-point]').forEach(function (input) {
      if (!(input instanceof HTMLInputElement)) return;
      var sectionId = input.getAttribute('data-section-id') || '';
      var questionId = input.getAttribute('data-question-id') || '';
      var markPointId = input.getAttribute('data-mark-point-id') || '';
      var question = questionScores[questionId];
      var markLabel = input.closest('label')?.querySelector('span')?.textContent?.replace(/\s+/g, ' ').trim() || markPointId;
      var riskFlags = parseJsonAttribute(input, 'data-risk-flags', []).filter(function (flag) {
        return P3_DIAGNOSTIC_RISK_FLAGS.includes(flag);
      });
      var result = checkSubmittedSkillAnswer(diagnosticSpecFromInput(input), input.value);
      var awarded = result.isCorrect ? 1 : 0;
      if (!sectionScores[sectionId]) sectionScores[sectionId] = { earned: 0, available: 0 };
      sectionScores[sectionId].earned += awarded;
      sectionScores[sectionId].available += 1;
      riskFlags.forEach(function (flag) {
        riskScores[flag].earned += awarded;
        riskScores[flag].available += 1;
      });
      if (input.getAttribute('data-critical-foundation-skill') && !result.isCorrect) {
        criticalFoundationFailed = true;
      }
      if (question) {
        question.earned += awarded;
        question.available += 1;
        if (!awarded) question.missedMarkLabels.push(markLabel);
      }
      markResults.push({
        questionId: questionId,
        markPointId: markPointId,
        sectionId: sectionId,
        label: markLabel,
        riskFlags: riskFlags,
        awarded: awarded
      });
      marksEarned += awarded;
      marksAvailable += 1;
    });

    var currentMissedStreak = 0;
    var longestMissedQuestionStreak = 0;
    var questionResults = questionOrder.map(function (questionId) {
      return questionScores[questionId];
    }).filter(Boolean);
    questionResults.forEach(function (question) {
      if (question.available > 0 && question.earned === 0) {
        currentMissedStreak += 1;
        longestMissedQuestionStreak = Math.max(longestMissedQuestionStreak, currentMissedStreak);
      } else {
        currentMissedStreak = 0;
      }
    });

    var sectionPercentages = P3_DIAGNOSTIC_SECTION_IDS.reduce(function (scores, sectionId) {
      scores[sectionId] = percentScore(sectionScores[sectionId].earned, sectionScores[sectionId].available);
      return scores;
    }, {});
    var riskFlags = P3_DIAGNOSTIC_RISK_FLAGS.filter(function (flag) {
      if (flag === 'ALGEBRA_WEAK' && sectionPercentages.algebra_foundation < 60) return true;
      return riskScores[flag].available > 0 && percentScore(riskScores[flag].earned, riskScores[flag].available) < 60;
    });
    var foundationRisk = sectionPercentages.algebra_foundation < 60 || criticalFoundationFailed;
    var highFluency = !foundationRisk
      && sectionPercentages.algebra_foundation >= 75
      && sectionPercentages.p3_transition >= 70
      && sectionPercentages.problem_solving >= 60;
    var standardEntry = !foundationRisk
      && sectionPercentages.algebra_foundation >= 60
      && sectionPercentages.p3_transition >= 50;
    var readinessLevel = highFluency ? 'HIGH_FLUENCY' : (standardEntry ? 'STANDARD_ENTRY' : 'FOUNDATION_RISK');
    var recommendedPath = readinessLevel === 'HIGH_FLUENCY'
      ? 'ACCELERATED_P3_PATH'
      : readinessLevel === 'STANDARD_ENTRY' ? 'FULL_P3_PATH' : 'P1_REPAIR_REQUIRED';

    var report = {
      total_score: percentScore(marksEarned, marksAvailable),
      section_scores: sectionPercentages,
      risk_flags: riskFlags,
      readiness_level: readinessLevel,
      recommended_path: recommendedPath,
      unlock_permissions: diagnosticUnlockPermissions(recommendedPath),
      priority_repair_modules: recommendedPath === 'P1_REPAIR_REQUIRED'
        ? P1_REPAIR_MODULE_TITLES
        : riskFlags.map(function (flag) {
          return P3_DIAGNOSTIC_REPAIR_MODULES[flag];
        }).filter(Boolean),
      foundation_repair_skill_tags: recommendedPath === 'P1_REPAIR_REQUIRED' ? P1_REPAIR_SKILL_TAGS : [],
      lock_message: recommendedPath === 'P1_REPAIR_REQUIRED' ? P1_REPAIR_LOCK_MESSAGE : undefined
    };

    return {
      report: report,
      markResults: markResults,
      questionResults: questionResults,
      marksEarned: marksEarned,
      marksAvailable: marksAvailable,
      longestMissedQuestionStreak: longestMissedQuestionStreak
    };
  }

  function buildP3DiagnosticReport(form) {
    return collectP3DiagnosticEvaluation(form).report;
  }

  function replaceChildrenWith(parent, children) {
    if (!parent) return;
    parent.replaceChildren();
    children.forEach(function (child) {
      parent.appendChild(child);
    });
  }

  function textElement(tagName, text, className) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function diagnosticStat(label, value) {
    var item = document.createElement('div');
    item.className = 'diagnostic-feedback-stat';
    item.appendChild(textElement('span', label));
    item.appendChild(textElement('strong', value));
    return item;
  }

  function diagnosticPathLabel(path) {
    if (path === 'P1_REPAIR_REQUIRED') return 'Foundation review';
    if (path === 'ACCELERATED_P3_PATH') return 'Accelerated P3';
    return 'Full P3 path';
  }

  function diagnosticReadinessLabel(level) {
    if (level === 'FOUNDATION_RISK') return 'Needs foundation evidence';
    if (level === 'HIGH_FLUENCY') return 'Strong starting evidence';
    return 'Standard starting evidence';
  }

  function renderDiagnosticSummary(panel, report, evaluation) {
    var summary = panel?.querySelector('[data-diagnostic-feedback-summary]');
    replaceChildrenWith(summary, [
      diagnosticStat('Score', evaluation.marksEarned + '/' + evaluation.marksAvailable + ' marks'),
      diagnosticStat('Evidence label', diagnosticReadinessLabel(report.readiness_level)),
      diagnosticStat('Route', diagnosticPathLabel(report.recommended_path))
    ]);
  }

  function renderDiagnosticSectionFeedback(panel, report) {
    var target = panel?.querySelector('[data-diagnostic-section-feedback]');
    if (!target) return;
    target.replaceChildren();
    target.appendChild(textElement('h3', 'Section scores'));
    var list = document.createElement('div');
    list.className = 'diagnostic-section-score-list';
    P3_DIAGNOSTIC_SECTION_IDS.forEach(function (sectionId) {
      var row = document.createElement('div');
      row.className = 'diagnostic-section-score-row';
      row.appendChild(textElement('span', P3_DIAGNOSTIC_SECTION_LABELS[sectionId] || sectionId));
      row.appendChild(textElement('strong', String(report.section_scores[sectionId] ?? 0) + '%'));
      list.appendChild(row);
    });
    target.appendChild(list);
  }

  function renderDiagnosticPriorityFeedback(panel, report) {
    var target = panel?.querySelector('[data-diagnostic-priority-feedback]');
    if (!target) return;
    target.replaceChildren();
    target.appendChild(textElement('h3', 'What this means'));
    target.appendChild(textElement('p', P3_DIAGNOSTIC_PATH_COPY[report.recommended_path] || 'Use the route recommendation as local study guidance.'));
    if (!report.risk_flags.length) {
      target.appendChild(textElement('p', 'No weak area was flagged by this diagnostic.'));
      return;
    }
    var list = document.createElement('ul');
    report.risk_flags.forEach(function (flag) {
      var item = document.createElement('li');
      item.textContent = P3_DIAGNOSTIC_RISK_LABELS[flag] || flag;
      list.appendChild(item);
    });
    target.appendChild(list);
  }

  function missedQuestionLabel(question) {
    var prefix = question.code ? question.code + ' - ' : '';
    var missed = question.missedMarkLabels.length ? ' missed: ' + question.missedMarkLabels.join(', ') : '';
    return prefix + question.title + missed;
  }

  function renderDiagnosticMissedFeedback(panel, evaluation) {
    var target = panel?.querySelector('[data-diagnostic-missed-feedback]');
    if (!target) return;
    target.replaceChildren();
    var missedQuestions = evaluation.questionResults.filter(function (question) {
      return question.available > 0 && question.earned < question.available;
    });
    target.appendChild(textElement('h3', 'Questions to revisit'));
    if (!missedQuestions.length) {
      target.appendChild(textElement('p', 'Every diagnostic question was marked correct.'));
      return;
    }
    var list = document.createElement('ul');
    missedQuestions.slice(0, 8).forEach(function (question) {
      var item = document.createElement('li');
      item.textContent = missedQuestionLabel(question);
      list.appendChild(item);
    });
    target.appendChild(list);
    if (missedQuestions.length > 8) {
      target.appendChild(textElement('p', 'Start with the first few items above, then use the repair lane to rebuild the foundations in order.'));
    }
  }

  function diagnosticConfidenceChecks(report, evaluation) {
    if (evaluation.longestMissedQuestionStreak < 3) return [];
    var flags = report.risk_flags.length ? report.risk_flags : ['ALGEBRA_WEAK'];
    var checks = [];
    flags.forEach(function (flag) {
      safeArray(P3_DIAGNOSTIC_CONFIDENCE_CHECKS[flag]).forEach(function (check) {
        if (checks.length < 4) checks.push(check);
      });
    });
    if (!checks.length) checks = P3_DIAGNOSTIC_CONFIDENCE_CHECKS.ALGEBRA_WEAK.slice(0, 3);
    return checks;
  }

  function renderDiagnosticConfidenceFeedback(panel, report, evaluation) {
    var target = panel?.querySelector('[data-diagnostic-confidence-panel]');
    if (!target) return;
    var checks = diagnosticConfidenceChecks(report, evaluation);
    target.replaceChildren();
    if (!checks.length) {
      target.hidden = true;
      return;
    }
    target.hidden = false;
    target.appendChild(textElement('h3', 'Warm-up before you continue'));
    target.appendChild(textElement('p', 'Start here for a few quick wins, then move into the repair work below.'));
    var list = document.createElement('div');
    list.className = 'diagnostic-confidence-list';
    checks.forEach(function (check) {
      var card = document.createElement('div');
      card.className = 'diagnostic-confidence-card';
      card.appendChild(textElement('strong', check.area));
      card.appendChild(textElement('p', check.prompt));
      card.appendChild(textElement('p', 'Answer: ' + check.answer, 'diagnostic-confidence-answer'));
      card.appendChild(textElement('p', check.why));
      list.appendChild(card);
    });
    target.appendChild(list);
  }

  function renderP3DiagnosticFeedback(panel, evaluation) {
    if (!panel) return;
    var report = evaluation.report;
    var json = panel.querySelector('[data-diagnostic-report-json]');
    var recommendation = panel.querySelector('[data-diagnostic-recommendation]');
    var nextLink = panel.querySelector('a.button');
    if (json) json.textContent = JSON.stringify(report, null, 2);
    if (recommendation) recommendation.textContent = P3_DIAGNOSTIC_PATH_COPY[report.recommended_path] || ('Student should proceed via: ' + report.recommended_path);
    if (nextLink) {
      if (report.recommended_path === 'P1_REPAIR_REQUIRED') {
        nextLink.textContent = 'Continue';
        nextLink.setAttribute('href', '../repair-lane/');
      } else {
        nextLink.textContent = 'Continue';
        nextLink.setAttribute('href', '../topics/');
      }
    }
    renderDiagnosticSummary(panel, report, evaluation);
    renderDiagnosticSectionFeedback(panel, report);
    renderDiagnosticPriorityFeedback(panel, report);
    renderDiagnosticMissedFeedback(panel, evaluation);
    renderDiagnosticConfidenceFeedback(panel, report, evaluation);
  }

  function saveP3DiagnosticReport(report) {
    var progress = loadProgress();
    var record = {
      id: createId('p3_diagnostic'),
      course: 'p3',
      report: report,
      submittedAt: new Date().toISOString()
    };
    progress.diagnosticReports = safeArray(progress.diagnosticReports).concat(record);
    progress.latestP3DiagnosticReport = record;
    if (report.recommended_path === 'P1_REPAIR_REQUIRED') {
      progress.p1RepairLaneModules = ensureP1RepairLaneStates(progress.p1RepairLaneModules);
    }
    saveProgress(progress);
    return record;
  }

  function submitP3Diagnostic(form) {
    var evaluation = collectP3DiagnosticEvaluation(form);
    saveP3DiagnosticReport(evaluation.report);
    updateProgressText();
    var panel = document.querySelector('[data-p3-diagnostic-report]');
    renderP3DiagnosticFeedback(panel, evaluation);
    if (panel) {
      panel.hidden = false;
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (evaluation.marksAvailable > 0 && evaluation.marksEarned === evaluation.marksAvailable) {
      var nextLink = panel?.querySelector('a.button');
      showCorrectCelebration({
        title: 'Diagnostic complete',
        message: 'Every diagnostic mark was correct. This is strong starting evidence for the P3 path.',
        primaryLabel: celebrationButtonLabel(nextLink, 'Continue'),
        onPrimary: nextLink instanceof HTMLElement ? function () { nextLink.click(); } : undefined
      });
    }
  }

  function p1RepairModuleIdsFromPage() {
    var pageIds = Array.from(document.querySelectorAll('[data-p1-repair-module]')).map(function (node) {
      return node.getAttribute('data-p1-repair-module') || '';
    }).filter(Boolean);
    return pageIds.length ? pageIds : P1_REPAIR_MODULES.map(function (module) { return module.module_id; });
  }

  function ensureP1RepairLaneStates(states) {
    var existing = safeArray(states);
    return P1_REPAIR_MODULES.map(function (module) {
      var current = existing.find(function (state) {
        return state && state.module_id === module.module_id;
      });
      return current || {
        module_id: module.module_id,
        status: 'IN_PROGRESS',
        fast_question_accuracy: 0,
        mini_check_passed: false,
        attempt_history: [],
        weak_skill_tags: module.weak_skill_tags
      };
    });
  }

  function latestP1RepairDiagnostic(progress) {
    var latest = progress.latestP3DiagnosticReport;
    if (latest && latest.report && latest.report.recommended_path === 'P1_REPAIR_REQUIRED') return latest;
    return safeArray(progress.diagnosticReports).slice().reverse().find(function (record) {
      return record && record.report && record.report.recommended_path === 'P1_REPAIR_REQUIRED';
    });
  }

  function p1RepairIsTriggered(progress) {
    return Boolean(latestP1RepairDiagnostic(progress));
  }

  function p1RepairSpecFromInput(input) {
    var toleranceText = input.getAttribute('data-tolerance') || '';
    var tolerance = toleranceText === '' ? NaN : Number(toleranceText);
    return {
      answerType: input.getAttribute('data-answer-type') || '',
      acceptedAnswers: parseJsonAttribute(input, 'data-accepted-answers', []),
      tolerance: Number.isFinite(tolerance) ? tolerance : undefined,
      orderMatters: input.getAttribute('data-order-matters') === 'true'
    };
  }

  function p1RepairStateFor(progress, moduleId) {
    return safeArray(progress.p1RepairLaneModules).find(function (state) {
      return state && state.module_id === moduleId;
    });
  }

  function p1RepairHasFastSubmission(state) {
    return safeArray(state && state.attempt_history).some(function (attempt) {
      return attempt && attempt.phase === 'FAST_QUESTION';
    });
  }

  function p1RepairMiniFirstAttemptCorrect(state) {
    return safeArray(state && state.attempt_history).some(function (attempt) {
      return attempt && attempt.phase === 'MINI_CHECK' && attempt.attempt_number === 1 && attempt.is_correct === true;
    });
  }

  function p1RepairMiniPassedWithinRetry(state) {
    return safeArray(state && state.attempt_history).some(function (attempt) {
      return attempt && attempt.phase === 'MINI_CHECK' && attempt.attempt_number <= 2 && attempt.is_correct === true;
    });
  }

  function p1RepairModuleComplete(state) {
    return Boolean(
      state
      && Number(state.fast_question_accuracy || 0) >= 70
      && state.mini_check_passed === true
      && p1RepairMiniPassedWithinRetry(state)
    );
  }

  function p1RepairUnlockStatus(progress) {
    var moduleIds = p1RepairModuleIdsFromPage();
    var states = moduleIds.map(function (moduleId) {
      return p1RepairStateFor(progress, moduleId);
    }).filter(Boolean);
    var completed = states.filter(p1RepairModuleComplete).length;
    var firstAttemptMiniChecks = states.filter(p1RepairMiniFirstAttemptCorrect).length;
    return {
      p3_access_unlocked: moduleIds.length > 0 && completed === moduleIds.length && firstAttemptMiniChecks >= 3,
      completed_module_count: completed,
      required_module_count: moduleIds.length || 5,
      first_attempt_mini_check_correct_count: firstAttemptMiniChecks,
      required_first_attempt_mini_check_correct_count: 3
    };
  }

  function updateP1RepairLaneStatus(progress) {
    var unlock = p1RepairUnlockStatus(progress);
    document.querySelectorAll('[data-p1-repair-module]').forEach(function (card) {
      var moduleId = card.getAttribute('data-p1-repair-module') || '';
      var state = p1RepairStateFor(progress, moduleId);
      var complete = p1RepairModuleComplete(state);
      var fastSubmitted = p1RepairHasFastSubmission(state);
      card.classList.toggle('is-complete', complete);
      var form = card.querySelector('[data-p1-repair-module-form]');
      if (form instanceof HTMLFormElement) {
        Array.from(form.elements).forEach(function (element) {
          if ('disabled' in element) element.disabled = false;
        });
      }
      var miniCheckPanel = card.querySelector('[data-p1-repair-mini-check-panel]');
      if (miniCheckPanel) miniCheckPanel.hidden = !fastSubmitted;
      var result = card.querySelector('[data-p1-repair-module-result]');
      if (result) {
        if (complete) {
          result.textContent = 'CHECKED EVIDENCE. Fast accuracy ' + Number(state.fast_question_accuracy || 0) + '%. Mini-check passed.';
        } else if (state) {
          result.textContent = fastSubmitted
            ? 'IN_PROGRESS. Fast accuracy ' + Number(state.fast_question_accuracy || 0) + '%. Mini-check not yet passed within the allowed attempts.'
            : 'Fast check not submitted.';
        } else {
          result.textContent = 'Fast check not submitted.';
        }
      }
    });

    document.querySelectorAll('[data-p1-repair-unlock-status]').forEach(function (node) {
      node.textContent = unlock.p3_access_unlocked
        ? 'P1 review complete.'
        : unlock.completed_module_count + '/' + unlock.required_module_count + ' modules complete; '
          + unlock.first_attempt_mini_check_correct_count + '/3 first-attempt mini-checks.';
    });
  }

  function setActiveP1RepairModule(moduleId, updateHash) {
    var cards = Array.from(document.querySelectorAll('[data-p1-repair-module]'));
    if (!cards.length) return;
    var selected = cards.find(function (card) {
      return card.getAttribute('data-p1-repair-module') === moduleId;
    }) || cards[0];
    var selectedId = selected.getAttribute('data-p1-repair-module') || '';
    cards.forEach(function (card) {
      var isSelected = card === selected;
      card.hidden = !isSelected;
    });
    document.querySelectorAll('[data-p1-repair-module-tab]').forEach(function (tab) {
      var isSelected = tab.getAttribute('data-p1-repair-module-tab') === selectedId;
      if (isSelected) {
        tab.setAttribute('aria-current', 'true');
      } else {
        tab.removeAttribute('aria-current');
      }
    });
    if (updateHash && selectedId) {
      var nextHash = '#' + selectedId;
      if (window.location.hash !== nextHash) {
        history.replaceState(null, '', nextHash);
      }
    }
  }

  function nextP1RepairModuleId(currentId) {
    var cards = Array.from(document.querySelectorAll('[data-p1-repair-module]'));
    if (!cards.length) return '';
    var currentIndex = cards.findIndex(function (card) {
      return card.getAttribute('data-p1-repair-module') === currentId;
    });
    var nextIndex = currentIndex >= 0 ? (currentIndex + 1) % cards.length : 0;
    return cards[nextIndex].getAttribute('data-p1-repair-module') || '';
  }

  function setupP1RepairLaneFlow() {
    var cards = Array.from(document.querySelectorAll('[data-p1-repair-module]'));
    if (!cards.length) return;
    var hashId = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
    setActiveP1RepairModule(hashId || cards[0].getAttribute('data-p1-repair-module') || '', false);
  }

  function applyP1RepairP3Locks(progress) {
    var triggered = p1RepairIsTriggered(progress);
    var unlock = p1RepairUnlockStatus(progress);
    var shouldLock = triggered && !unlock.p3_access_unlocked;
    function repairLaneHrefForCurrentPage() {
      var path = window.location.pathname || '';
      if (/\/p3\/topics\/[^/]+\/[^/]+\//.test(path)) return '../../../repair-lane/index.html';
      if (/\/p3\/(?:topics|review|need-to-know|diagnostic)\//.test(path)) return '../repair-lane/index.html';
      if (/\/p3\//.test(path)) return 'repair-lane/index.html';
      return 'p3/repair-lane/index.html';
    }
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var canonical = link.getAttribute('data-canonical-path') || href;
      var isP3Progression = /(?:^|\/)p3\/(?:topics|review|need-to-know)\//.test(canonical)
        || /(?:^|\/)p3\/topics\/index\.html/.test(canonical)
        || /exam-training\/index\.html/.test(canonical)
        || /(?:^|\/)topics\/index\.html/.test(canonical)
        || /(?:^|\/)review\/index\.html/.test(canonical)
        || /(?:^|\/)need-to-know\/index\.html/.test(canonical);
      if (!isP3Progression) return;
      link.classList.toggle('is-repair-locked-link', shouldLock);
      if (shouldLock) {
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('data-original-href', link.getAttribute('data-original-href') || href);
        link.setAttribute('href', repairLaneHrefForCurrentPage());
        link.setAttribute('title', P1_REPAIR_LOCK_MESSAGE);
      } else if (link.getAttribute('data-original-href')) {
        link.setAttribute('href', link.getAttribute('data-original-href') || href);
        link.removeAttribute('data-original-href');
        link.removeAttribute('aria-disabled');
        link.removeAttribute('title');
      }
    });
  }

  function p1RepairAttemptNumber(history, questionId, phase) {
    return safeArray(history).filter(function (attempt) {
      return attempt && attempt.question_id === questionId && attempt.phase === phase;
    }).length + 1;
  }

  function showP1RepairFeedback(input, result) {
    var questionId = input.getAttribute('data-question-id') || input.name || '';
    var feedback = input.closest('.repair-answer-field')?.querySelector('[data-repair-feedback-for="' + questionId + '"]');
    if (!feedback) return;
    var correction = input.getAttribute('data-correction') || 'Check the core method and try again.';
    feedback.textContent = result.isCorrect ? 'Correct.' : 'Incorrect. ' + correction;
    feedback.classList.toggle('is-correct', result.isCorrect);
    feedback.classList.toggle('is-incorrect', !result.isCorrect);
  }

  function submitP1RepairModule(form, submitter) {
    var moduleId = form.getAttribute('data-module-id') || '';
    var progress = loadProgress();
    var existing = p1RepairStateFor(progress, moduleId) || {};
    var previousHistory = safeArray(existing.attempt_history);
    var newHistory = [];
    var activeElement = document.activeElement;
    var submitPhase = submitter instanceof HTMLElement && submitter.getAttribute('value') === 'mini'
      ? 'mini'
      : activeElement instanceof HTMLElement && activeElement.closest('[data-p1-repair-mini-check-panel]') ? 'mini' : 'fast';
    var fastInputs = Array.from(form.querySelectorAll('[data-p1-repair-fast-question]')).filter(function (input) {
      return input instanceof HTMLInputElement;
    });
    var correctFast = 0;
    var fastAccuracy = Number(existing.fast_question_accuracy || 0);
    if (submitPhase === 'fast') {
      fastInputs.forEach(function (input) {
        var result = checkSubmittedSkillAnswer(p1RepairSpecFromInput(input), input.value);
        if (result.isCorrect) correctFast += 1;
        showP1RepairFeedback(input, result);
        newHistory.push({
          question_id: input.getAttribute('data-question-id') || input.name || '',
          phase: 'FAST_QUESTION',
          is_correct: result.isCorrect,
          attempted_at: new Date().toISOString(),
          attempt_number: p1RepairAttemptNumber(previousHistory, input.getAttribute('data-question-id') || input.name || '', 'FAST_QUESTION')
        });
      });
      fastAccuracy = percentScore(correctFast, fastInputs.length);
    }

    var miniInput = form.querySelector('[data-p1-repair-mini-check]');
    var miniPassed = existing.mini_check_passed === true;
    var miniResultForCelebration = null;
    var miniAttemptNumberForCelebration = 0;
    if (submitPhase === 'mini' && miniInput instanceof HTMLInputElement) {
      var miniQuestionId = miniInput.getAttribute('data-question-id') || miniInput.name || '';
      var miniResult = checkSubmittedSkillAnswer(p1RepairSpecFromInput(miniInput), miniInput.value);
      var miniAttemptNumber = p1RepairAttemptNumber(previousHistory, miniQuestionId, 'MINI_CHECK');
      miniResultForCelebration = miniResult;
      miniAttemptNumberForCelebration = miniAttemptNumber;
      showP1RepairFeedback(miniInput, miniResult);
      newHistory.push({
        question_id: miniQuestionId,
        phase: 'MINI_CHECK',
        is_correct: miniResult.isCorrect,
        attempted_at: new Date().toISOString(),
        attempt_number: miniAttemptNumber
      });
      miniPassed = miniPassed || (miniResult.isCorrect && miniAttemptNumber <= 2);
    }

    var fullHistory = previousHistory.concat(newHistory);
    var nextState = {
      module_id: moduleId,
      status: fastAccuracy >= 70 && miniPassed ? 'COMPLETE' : 'IN_PROGRESS',
      fast_question_accuracy: fastAccuracy,
      mini_check_passed: miniPassed,
      attempt_history: fullHistory,
      weak_skill_tags: parseJsonAttribute(form, 'data-weak-skill-tags', [])
    };
    progress.p1RepairLaneModules = safeArray(progress.p1RepairLaneModules)
      .filter(function (state) { return state && state.module_id !== moduleId; })
      .concat(nextState);
    saveProgress(progress);
    updateProgressText();
    if (submitPhase === 'fast') {
      var miniPanel = form.querySelector('[data-p1-repair-mini-check-panel]');
      if (miniPanel) miniPanel.hidden = false;
      if (correctFast > 0) {
        showCorrectCelebration({
          title: correctFast === fastInputs.length ? 'Fast check correct' : 'Good repair',
          message: correctFast + ' of ' + fastInputs.length + ' fast repair answer' + (fastInputs.length === 1 ? '' : 's') + ' correct.',
          primaryLabel: correctFast === fastInputs.length ? 'Continue to mini-check' : 'Keep repairing',
          onPrimary: miniPanel instanceof HTMLElement
            ? function () {
              miniPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
              var miniField = miniPanel.querySelector('input, button');
              if (miniField instanceof HTMLElement) miniField.focus({ preventScroll: true });
            }
            : undefined
        });
      }
    }
    if (submitPhase === 'mini' && miniResultForCelebration?.isCorrect) {
      var nextModule = form.querySelector('[data-p1-repair-next]');
      showCorrectCelebration({
        title: 'Mini-check correct',
        message: miniAttemptNumberForCelebration <= 2
          ? 'Mini-check passed within the retry window for this repair module.'
          : 'Mini-check answer is correct, but the module pass window has already been used.',
        primaryLabel: celebrationButtonLabel(nextModule, 'Next module'),
        onPrimary: celebrationButtonAction(nextModule)
      });
    }
  }

  // Parity tests use this hook to compare the student-facing static checker with the TypeScript checker.
  window.__ASTERION_SKILL_CHECK_TEST_HOOKS__ = {
    checkSubmittedSkillAnswer: checkSubmittedSkillAnswer,
    buildP3DiagnosticReport: buildP3DiagnosticReport,
    collectP3DiagnosticEvaluation: collectP3DiagnosticEvaluation,
    renderP3DiagnosticFeedback: renderP3DiagnosticFeedback,
    setupP3DiagnosticFlow: setupP3DiagnosticFlow,
    p1RepairUnlockStatus: p1RepairUnlockStatus
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
    progress = updateErrorClassificationFromTags(progress, checkId, selectedMistakeTags(form));
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

  function timestampMs(value) {
    var ms = Date.parse(String(value || ''));
    return Number.isFinite(ms) ? ms : undefined;
  }

  function repairDueTimestamp(attempt, interval) {
    var base = timestampMs(attempt.timestamp);
    return base === undefined ? undefined : base + interval.days * DAY_MS;
  }

  function isCleanCorrectRelatedAttempt(attempt, source) {
    return Boolean(attempt
      && attempt.course === 'p3'
      && attempt.skillId === source.skillId
      && attempt.isCorrect
      && !attempt.revealedAnswer
      && !attempt.revealedRepairStep);
  }

  function cleanRelatedRepairTimes(attempts, source) {
    var sourceAt = timestampMs(source.timestamp);
    if (sourceAt === undefined) return [];
    return safeArray(attempts).flatMap(function (attempt) {
      var attemptAt = timestampMs(attempt && attempt.timestamp);
      return attemptAt !== undefined
        && attemptAt > sourceAt
        && isCleanCorrectRelatedAttempt(attempt, source)
        ? [attemptAt]
        : [];
    }).sort(function (a, b) { return a - b; });
  }

  function completedSkillRepairStages(attempts, source) {
    var repairTimes = cleanRelatedRepairTimes(attempts, source);
    var nextRepairIndex = 0;
    var completed = 0;
    for (var intervalIndex = 0; intervalIndex < SKILL_REPAIR_INTERVALS.length; intervalIndex += 1) {
      var dueAt = repairDueTimestamp(source, SKILL_REPAIR_INTERVALS[intervalIndex]);
      if (dueAt === undefined) break;
      var repairIndex = repairTimes.findIndex(function (time, index) {
        return index >= nextRepairIndex && time >= dueAt;
      });
      if (repairIndex < 0) break;
      completed += 1;
      nextRepairIndex = repairIndex + 1;
    }
    return completed;
  }

  function buildReviewGroups(attempts) {
    var groups = new Map();
    var validAttempts = safeArray(attempts)
      .filter(function (attempt) {
        return attempt && attempt.course === 'p3' && typeof attempt.checkId === 'string' && typeof attempt.timestamp === 'string';
      });
    validAttempts
      .slice()
      .sort(function (a, b) {
        return String(b.timestamp).localeCompare(String(a.timestamp));
      })
      .slice(0, 30)
      .forEach(function (attempt) {
        var state = reviewCandidateState(attempt);
        var tags = validReviewMistakeTags(attempt);
        if (!state || !tags.length) return;
        var completedStages = completedSkillRepairStages(validAttempts, attempt);
        var interval = SKILL_REPAIR_INTERVALS.find(function (candidateInterval, index) {
          var candidateDueAt = repairDueTimestamp(attempt, candidateInterval);
          return index >= completedStages && candidateDueAt !== undefined && candidateDueAt <= Date.now();
        });
        var dueAt = interval ? repairDueTimestamp(attempt, interval) : undefined;
        if (!interval || dueAt === undefined) return;
        var candidate = {
          topic: attempt.topic || 'P3 Checked Practice',
          skillId: attempt.skillId || '',
          checkId: attempt.checkId || '',
          regionId: attempt.regionId || '',
          submittedAnswer: attempt.submittedAnswer || '',
          timestamp: attempt.timestamp || '',
          state: state,
          repairAttemptNumber: SKILL_REPAIR_INTERVALS.indexOf(interval) + 1,
          dueAt: new Date(dueAt).toISOString(),
          dueLabel: interval.label,
          relatedSkillId: attempt.skillId || ''
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

  function formatShortDate(value) {
    var ms = timestampMs(value);
    if (ms === undefined) return 'now';
    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function validSkillRepairRoutes(value) {
    return safeArray(value).filter(function (route) {
      return route
        && typeof route.skillId === 'string'
        && typeof route.href === 'string'
        && typeof route.label === 'string';
    });
  }

  function skillRepairRouteForCandidate(routes, candidate) {
    return routes.find(function (route) {
      return route.skillId === candidate.relatedSkillId || route.skillId === candidate.skillId;
    });
  }

  function renderReviewPage() {
    var groupContainer = document.querySelector('[data-review-groups]');
    var reviewSection = document.querySelector('[data-review-session]');
    var emptyState = document.querySelector('[data-review-empty]');
    if (!groupContainer || !reviewSection || !emptyState) return;
    var repairRoutes = validSkillRepairRoutes(parseJsonAttribute(reviewSection, 'data-review-skill-routes', []));
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
      summary.textContent = total + ' due spaced repair candidate' + (total === 1 ? '' : 's') + ' from this browser.';
    }
    groupContainer.innerHTML = groups.map(function (group) {
      return '<article class="review-group-card">'
        + '<header><div><p class="eyebrow">' + group.count + ' due</p><h3>' + escapeText(group.mistakeTag) + '</h3></div></header>'
        + '<p class="targeted-prompt">' + escapeText(TARGETED_MISTAKE_PROMPTS[group.mistakeTag] || 'Review what went wrong before trying again.') + '</p>'
        + '<ul class="review-candidate-list">'
        + group.candidates.map(function (candidate) {
          var route = skillRepairRouteForCandidate(repairRoutes, candidate);
          return '<li>'
            + '<strong>' + escapeText(candidate.topic) + '</strong>'
            + '<span>' + escapeText(candidate.dueLabel || 'spaced repair') + ' · try a related check for ' + escapeText(candidate.relatedSkillId || candidate.skillId || candidate.checkId) + '</span>'
            + '<small>' + escapeText(candidate.state) + ' · due ' + escapeText(formatShortDate(candidate.dueAt)) + (candidate.submittedAnswer ? ' · submitted: ' + escapeText(candidate.submittedAnswer) : '') + '</small>'
            + (route ? '<a class="button secondary-button review-repair-link" href="' + escapeText(route.href) + '">Open related question: ' + escapeText(route.label) + '</a>' : '')
            + '</li>';
        }).join('')
        + '</ul></article>';
    }).join('');
  }

  function attemptHistoryRecordsForSection(section, progress) {
    var history = normalizeStudentAttemptHistory(progress.attemptHistory);
    var source = section.getAttribute('data-attempt-history-source') || '';
    var regionId = section.getAttribute('data-attempt-history-region') || '';
    var limit = Number(section.getAttribute('data-attempt-history-limit') || 60);
    return history.records
      .filter(function (record) {
        return (!source || record.source === source)
          && (!regionId || record.regionId === regionId);
      })
      .sort(function (a, b) {
        return String(b.timestamp).localeCompare(String(a.timestamp));
      })
      .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 60);
  }

  function groupAttemptHistoryByQuestion(records) {
    var groups = new Map();
    records.forEach(function (record) {
      var key = record.questionId || record.id;
      var group = groups.get(key) || {
        questionId: key,
        title: record.questionTitle || record.questionId || 'Question',
        topic: record.topic || '',
        records: []
      };
      group.records.push(record);
      groups.set(key, group);
    });
    return Array.from(groups.values()).map(function (group) {
      return Object.assign({}, group, {
        records: group.records.sort(function (a, b) { return a.attemptNumber - b.attemptNumber; }),
        lastTimestamp: group.records.reduce(function (latest, record) {
          return String(record.timestamp) > latest ? String(record.timestamp) : latest;
        }, '')
      });
    }).sort(function (a, b) {
      return String(b.lastTimestamp).localeCompare(String(a.lastTimestamp));
    });
  }

  function attemptHistoryDateLabel(record) {
    var ms = timestampMs(record.timestamp);
    if (ms === undefined) return '';
    return new Date(ms).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderAttemptHistoryRecord(record) {
    var state = record.correct ? 'correct' : 'incorrect';
    var statusLabel = record.correct ? 'Correct' : 'Incorrect';
    var response = record.responseDisplay || record.response || 'No answer submitted';
    var correctAnswer = record.correctAnswer || 'Check the revealed answer on the question.';
    var explanation = record.explanation || '';
    return '<article class="attempt-history-record is-' + state + '">'
      + '<header>'
      + '<span class="attempt-history-indicator">' + statusLabel + '</span>'
      + '<span>Attempt ' + escapeText(record.attemptNumber) + (attemptHistoryDateLabel(record) ? ' · ' + escapeText(attemptHistoryDateLabel(record)) : '') + '</span>'
      + '</header>'
      + '<dl class="attempt-history-answer-list">'
      + '<div><dt>Your answer</dt><dd>' + escapeText(response) + '</dd></div>'
      + '<div><dt>Correct answer</dt><dd>' + escapeText(correctAnswer) + '</dd></div>'
      + (explanation ? '<div><dt>Explanation</dt><dd>' + escapeText(explanation) + '</dd></div>' : '')
      + '</dl>'
      + (!record.correct && record.retryHref ? '<a class="button secondary-button attempt-history-retry" href="' + escapeText(record.retryHref) + '">Retry</a>' : '')
      + '</article>';
  }

  function renderAttemptHistorySections(progress) {
    document.querySelectorAll('[data-attempt-history-list]').forEach(function (section) {
      var records = attemptHistoryRecordsForSection(section, progress || loadProgress());
      var list = section.querySelector('[data-attempt-history-items]');
      var empty = section.querySelector('[data-attempt-history-empty]');
      var summary = section.querySelector('[data-attempt-history-summary]');
      if (!list) return;
      if (summary) {
        var incorrectCount = records.filter(function (record) { return !record.correct; }).length;
        summary.textContent = records.length
          ? records.length + ' submitted response' + (records.length === 1 ? '' : 's') + ' saved. ' + incorrectCount + ' need' + (incorrectCount === 1 ? 's' : '') + ' review.'
          : 'No submitted responses saved in this browser yet.';
      }
      if (!records.length) {
        list.innerHTML = '';
        if (empty) empty.hidden = false;
        return;
      }
      if (empty) empty.hidden = true;
      list.innerHTML = groupAttemptHistoryByQuestion(records).map(function (group, index) {
        return '<article class="attempt-history-question-card">'
          + '<header><div><p class="eyebrow">Question ' + (index + 1) + '</p><h3>' + escapeText(group.title) + '</h3>'
          + (group.topic ? '<p>' + escapeText(group.topic) + '</p>' : '')
          + '</div></header>'
          + '<div class="attempt-history-record-stack">'
          + group.records.map(renderAttemptHistoryRecord).join('')
          + '</div></article>';
      }).join('');
    });
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

  function submittedAnswerFromForm(form) {
    return new FormData(form).getAll('submittedAnswer').map(function (value) {
      return String(value).trim();
    }).filter(Boolean).join(', ');
  }

  function answerDisplayFromForm(form, submittedAnswer) {
    var labelMap = parseJsonAttribute(form, 'data-answer-labels', {});
    var labels = isRecord(labelMap) ? labelMap : {};
    var selected = new FormData(form).getAll('submittedAnswer').map(function (value) {
      return String(value).trim();
    }).filter(Boolean);
    if (!selected.length) return submittedAnswer;
    return selected.map(function (value) {
      return typeof labels[value] === 'string' ? labels[value] : value;
    }).join(', ');
  }

  function currentPageRetryHref(form) {
    var id = form.closest('[id]')?.getAttribute('id') || form.getAttribute('data-check-id') || '';
    var base = window.location.pathname + window.location.search;
    return id ? base + '#' + encodeURIComponent(id) : base;
  }

  function historyRecordFromForm(form, attemptId, source, submittedAnswer, isCorrect, timestamp) {
    var questionId = form.getAttribute('data-check-id') || '';
    return {
      id: attemptId + ':history',
      source: source,
      course: 'p3',
      questionId: questionId,
      questionTitle: form.getAttribute('data-question-title') || form.getAttribute('data-topic') || questionId,
      topic: form.getAttribute('data-topic') || '',
      regionId: form.getAttribute('data-region-id') || '',
      skillId: form.getAttribute('data-skill-id') || '',
      response: submittedAnswer,
      responseDisplay: answerDisplayFromForm(form, submittedAnswer),
      correct: Boolean(isCorrect),
      correctAnswer: form.getAttribute('data-correct-answer-label') || '',
      explanation: form.getAttribute('data-explanation') || '',
      timestamp: timestamp,
      retryHref: currentPageRetryHref(form),
      relatedAttemptId: attemptId
    };
  }

  function saveSkillCheckLocalAttempt(form, submittedAnswer, checkResult) {
    var progress = loadProgress();
    var now = new Date().toISOString();
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
      timestamp: now
    };
    progress.skillCheckAttempts.push(attempt);
    progress = appendStudentAttemptHistoryRecord(
      progress,
      historyRecordFromForm(form, attempt.attemptId, 'checked_practice', submittedAnswer, attempt.isCorrect, now)
    );
    progress = updateStudentPerformanceState(progress, {
      kind: 'assessment',
      assessment_id: attempt.attemptId,
      student_id: PROFILE_ID,
      source: 'checked_practice',
      unit: attempt.regionId || attempt.topic,
      timestamp: Date.parse(attempt.timestamp),
      finalAnswer: attempt.submittedAnswer,
      usedHint: attempt.usedHint,
      revealedAnswer: attempt.revealedAnswer || attempt.revealedRepairStep,
      questions: [{
        question_id: attempt.checkId,
        unit: attempt.regionId || attempt.topic,
        topic: attempt.topic,
        regionId: attempt.regionId,
        skillRef: attempt.skillId,
        skillNodeIds: [attempt.skillId].filter(Boolean),
        skillNodes: [{
          id: attempt.skillId,
          label: attempt.topic,
          course: attempt.course,
          regionId: attempt.regionId,
          source: 'skill_check'
        }],
        markPoints: [{
          id: attempt.checkId,
          label: attempt.topic,
          gained: attempt.isCorrect,
          marks: 1,
          skillNodeIds: [attempt.skillId].filter(Boolean),
          errorType: knowledgeTypeFromTags(attempt.mistakeTags),
          evidenceStrength: 0.85
        }],
        marksEarned: attempt.isCorrect ? 1 : 0,
        marksAvailable: 1,
        scoreLost: attempt.isCorrect ? 0 : 1,
        error_type: normalizeErrorType(undefined, attempt.mistakeTags),
        mistakeTags: attempt.mistakeTags
      }]
    });
    saveProgress(progress);
    updateProgressText();
    return attempt;
  }

  function saveLearnModeAttempt(form, submittedAnswer, checkResult) {
    var progress = loadProgress();
    var now = new Date().toISOString();
    var regionId = form.getAttribute('data-region-id') || '';
    var stepId = form.getAttribute('data-step-id') || form.getAttribute('data-field-guide-topic-id') || '';
    var usedHint = form.getAttribute('data-used-hint') === 'true';
    var revealedAnswer = form.getAttribute('data-revealed-answer') === 'true';
    var strongEvidence = Boolean(checkResult.isCorrect && !usedHint && !revealedAnswer);
    var stepCard = form.closest('[data-learn-step-card]');
    var requiresSimilar = stepCard?.getAttribute('data-learn-requires-similar') === 'true';
    var variant = form.getAttribute('data-learn-variant') || 'primary';
    var completesStep = Boolean(checkResult.isCorrect && (!requiresSimilar || variant === 'similar'));
    var attempt = {
      id: createId('learn_attempt'),
      regionId: regionId,
      activityType: 'learn_mode',
      activityId: form.getAttribute('data-check-id') || stepId,
      stepId: stepId,
      variant: variant,
      topic: form.getAttribute('data-topic') || '',
      prompt: form.getAttribute('data-step-title') || '',
      submittedAnswer: submittedAnswer,
      isCorrect: Boolean(checkResult.isCorrect),
      usedHint: usedHint,
      revealedAnswer: revealedAnswer,
      strongEvidence: strongEvidence,
      mistakeTags: selectedMistakeTags(form),
      createdAt: now,
      completedAt: completesStep ? now : undefined
    };
    progress.learningActivityAttempts.push(attempt);
    progress = appendStudentAttemptHistoryRecord(
      progress,
      historyRecordFromForm(form, attempt.id, 'learn_mode', submittedAnswer, attempt.isCorrect, now)
    );
    if (completesStep) {
      progress = completeLearnStepInProgress(progress, regionId, stepId, form.getAttribute('data-step-title') || '', attempt.id);
    }
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
      ? 'Answer revealed. This helps you learn, but it does not count as a clean pass.'
      : 'Repair step revealed. This helps you learn, but it does not count as a clean pass.', 'repaired');
  }

  function checkSkillAnswer(form) {
    var submittedAnswer = submittedAnswerFromForm(form);
    var checkResult = checkSubmittedSkillAnswer(skillCheckSpecFromForm(form), submittedAnswer);
    saveSkillCheckLocalAttempt(form, submittedAnswer, checkResult);
    var submitButton = form.querySelector('button[type="submit"]');
    var nextButton = form.querySelector('[data-skill-check-inline-next]');
    var repair = form.querySelector('[data-skill-repair]');
    var answerReveal = form.querySelector('[data-skill-answer-reveal]');
    var mistakePanel = form.querySelector('[data-mistake-tag-panel]');
    if (checkResult.isCorrect && form.getAttribute('data-revealed-answer') !== 'true' && form.getAttribute('data-revealed-repair-step') !== 'true') {
      setSkillFeedback(form, 'Correct. Saved as a clean Checked Practice pass.', 'correct');
      form.classList.add('is-passed');
      if (nextButton) nextButton.hidden = false;
      if (submitButton) {
        submitButton.textContent = 'Check Answer';
        submitButton.className = 'button secondary-button';
      }
      showCorrectCelebration({
        title: 'Correct',
        message: 'A clean Checked Practice pass is the strongest local evidence.',
        primaryLabel: celebrationButtonLabel(nextButton, 'Continue'),
        onPrimary: celebrationButtonAction(nextButton)
      });
      return;
    }
    if (checkResult.isCorrect) {
      setSkillFeedback(form, 'Correct, but this was already revealed or repaired, so it is not a clean pass.', 'repaired');
      if (nextButton) nextButton.hidden = false;
      showCorrectCelebration({
        title: 'Correct',
        message: 'Hints, revealed answers, and repair help you learn, but they do not count as a clean pass.',
        primaryLabel: celebrationButtonLabel(nextButton, 'Continue'),
        onPrimary: celebrationButtonAction(nextButton)
      });
      return;
    }
    setSkillFeedback(form, 'Not yet. Saved as an incorrect attempt. Try Again or open the repair step.', 'incorrect');
    if (submitButton) {
      submitButton.textContent = 'Try Again';
      submitButton.className = 'button primary-button';
    }
    if (mistakePanel) mistakePanel.hidden = false;
    updateTargetedPrompt(form);
    if (repair) repair.hidden = false;
    if (answerReveal) answerReveal.hidden = false;
    if (nextButton) nextButton.hidden = true;
  }

  function checkLearnAnswer(form) {
    var submittedAnswer = submittedAnswerFromForm(form);
    var checkResult = checkSubmittedSkillAnswer(skillCheckSpecFromForm(form), submittedAnswer);
    saveLearnModeAttempt(form, submittedAnswer, checkResult);

    var submitButton = form.querySelector('button[type="submit"]');
    var hint = form.querySelector('[data-learn-hint]');
    var afterAttempt = form.querySelector('[data-learn-after-attempt]');
    var answerReveal = form.querySelector('[data-learn-answer-reveal]');
    var retryCta = form.querySelector('[data-retry-learn-primary]');
    var similarCta = form.querySelector('[data-try-learn-similar]');
    var stepCard = form.closest('[data-learn-step-card]');
    var variant = form.getAttribute('data-learn-variant') || 'primary';
    var isPrimary = variant === 'primary';
    var requiresSimilar = stepCard?.getAttribute('data-learn-requires-similar') === 'true';
    var similar = stepCard?.querySelector('[data-learn-similar-panel]');
    var transfer = stepCard?.querySelector('[data-learn-exam-transfer]');

    if (afterAttempt) afterAttempt.hidden = false;
    if (answerReveal) {
      answerReveal.hidden = false;
      answerReveal.classList.toggle('is-highlighted', !checkResult.isCorrect);
    }
    if (isPrimary && similar) similar.hidden = false;
    if (transfer && (!requiresSimilar || !isPrimary)) transfer.hidden = false;
    if (retryCta && isPrimary) retryCta.hidden = false;
    if (similarCta && isPrimary && similar) similarCta.hidden = false;

    if (checkResult.isCorrect) {
      setSkillFeedback(form, 'Correct. Saved as Learn progress only; use Checked Practice for clean pass evidence.', 'correct');
      form.classList.add('is-passed');
      if (submitButton) {
        submitButton.textContent = 'Check Answer';
        submitButton.className = 'button secondary-button';
      }
      if (retryCta) retryCta.hidden = true;
      if (isPrimary && requiresSimilar) {
        setSkillFeedback(form, 'Correct. Primary step checked; complete the similar question before this lesson step is finished.', 'correct');
      }
      window.dispatchEvent(new CustomEvent('asterion:learn-progress'));
      updateLearnModeFlowState();
      var inlineNext = stepCard?.querySelector('[data-learn-inline-next]');
      var primaryTarget = isPrimary && requiresSimilar && similarCta instanceof HTMLButtonElement
        ? similarCta
        : inlineNext;
      showCorrectCelebration({
        title: 'Correct',
        message: isPrimary && requiresSimilar
          ? 'Primary check is correct. Complete the similar question before this lesson step is finished.'
          : 'Saved as Learn progress only. A clean Checked Practice pass is the strongest local evidence.',
        primaryLabel: celebrationButtonLabel(primaryTarget, isPrimary && requiresSimilar ? 'Try a similar question' : 'Next step'),
        onPrimary: celebrationButtonAction(primaryTarget)
      });
      return;
    }

    setSkillFeedback(form, 'Not yet. Review the explanation, then try this first setup again before moving on.', 'incorrect');
    form.setAttribute('data-used-hint', 'true');
    if (hint) hint.hidden = false;
    if (submitButton) {
      submitButton.textContent = 'Try Again';
      submitButton.className = 'button primary-button';
    }
    if (retryCta instanceof HTMLElement && isPrimary) retryCta.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent('asterion:learn-progress'));
    updateLearnModeFlowState();
  }

  function retryLearnPrimaryQuestion(button) {
    var form = button.closest('[data-check-learn-answer]');
    if (!(form instanceof HTMLFormElement)) return;
    Array.from(form.elements).forEach(function (field) {
      if (field instanceof HTMLInputElement && field.name === 'submittedAnswer') {
        if (field.type === 'checkbox' || field.type === 'radio') field.checked = false;
        else field.value = '';
      }
      if (field instanceof HTMLTextAreaElement && field.name === 'submittedAnswer') field.value = '';
    });
    var input = form.querySelector('[name="submittedAnswer"]');
    var submit = form.querySelector('button[type="submit"]');
    setSkillFeedback(form, 'Try the first checked setup again. The explanation can stay open while you retry.', 'incorrect');
    if (submit instanceof HTMLButtonElement) {
      submit.textContent = 'Check Answer';
      submit.className = 'button primary-button';
    }
    if (input instanceof HTMLElement) input.focus();
  }

  function openLearnSimilarPanel(button) {
    var card = button.closest('[data-learn-step-card]');
    if (!(card instanceof HTMLElement)) return;
    var targetId = button.getAttribute('data-try-learn-similar') || '';
    var panel = targetId ? card.querySelector('#' + CSS.escape(targetId)) : null;
    if (!(panel instanceof HTMLElement)) panel = card.querySelector('[data-learn-similar-panel]');
    if (!(panel instanceof HTMLElement)) return;
    panel.hidden = false;
    var input = panel.querySelector('input, textarea, select, button');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (input instanceof HTMLElement) {
      window.setTimeout(function () { input.focus(); }, 180);
    }
  }

  function examPartScores(form) {
    var sourceParts = [];
    try {
      var parsedParts = JSON.parse(form.getAttribute('data-parts') || '[]');
      sourceParts = Array.isArray(parsedParts) ? parsedParts : [];
    } catch (_error) {
      sourceParts = [];
    }
    return Array.from(form.querySelectorAll('[data-exam-part]')).map(function (part) {
      var partIndex = Number(part.getAttribute('data-part-index') || 0);
      var sourcePart = sourceParts[partIndex] || {};
      var availableMarkPoints = safeArray(sourcePart.markPoints);
      var marksAvailable = Number(part.getAttribute('data-marks-available') || 0);
      var markPointsAvailable = Number(part.getAttribute('data-mark-points-available') || 0);
      var marksInput = part.querySelector('[data-part-marks-earned]');
      var marksEarned = Number(marksInput?.value || 0);
      var tickedMarkPoints = Array.from(part.querySelectorAll('[data-mark-point]:checked')).map(function (input) {
        return input.value;
      }).filter(Boolean);
      var markPointLabels = availableMarkPoints.reduce(function (labels, point) {
        if (point && typeof point.id === 'string') labels[point.id] = point.label || point.markCode || '';
        return labels;
      }, {});
      var attempted = Boolean(part.querySelector('[data-part-attempted]')?.checked || marksEarned > 0 || tickedMarkPoints.length > 0);
      return {
        partId: part.getAttribute('data-part-id') || undefined,
        subpartId: part.getAttribute('data-subpart-id') || undefined,
        label: part.getAttribute('data-part-label') || 'Whole question',
        attempted: attempted,
        marksEarned: marksEarned,
        marksAvailable: marksAvailable,
        markPointIds: tickedMarkPoints,
        markPointIdsAvailable: availableMarkPoints.map(function (point) { return point && point.id; }).filter(Boolean),
        markPointLabels: markPointLabels,
        markPointsAvailable: markPointsAvailable,
        primaryTopicId: part.getAttribute('data-primary-topic-id') || undefined,
        skillRef: part.getAttribute('data-skill-ref') || sourcePart.skillRef || undefined,
        mappedRegionId: part.getAttribute('data-mapped-region-id') || undefined
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
    var partScores = examPartScores(form);
    var validationMessage = validateExamPartScores(partScores);
    var marksEarned = partScores.reduce(function (sum, part) { return sum + part.marksEarned; }, 0);
    var markPointsTicked = partScores.reduce(function (sum, part) { return sum + safeArray(part.markPointIds).length; }, 0);
    var markPointsAvailable = partScores.reduce(function (sum, part) { return sum + Number(part.markPointsAvailable || 0); }, 0);
    var status = form.querySelector('.form-status');
    var card = form.closest('.exam-question-card');
    var markSchemeRevealed = Boolean(card?.querySelector('[data-mark-scheme-reveal]')?.open);
    if (validationMessage || !markSchemeRevealed) {
      if (status) {
        status.textContent = validationMessage || 'Reveal the mark scheme before saving a self-marked attempt.';
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
      fullScoreConfirmed: marksAvailable > 0 && marksEarned === marksAvailable,
      selfMarked: true,
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
    progress = updateStudentPerformanceState(progress, {
      kind: 'assessment',
      assessment_id: attempt.id,
      student_id: PROFILE_ID,
      source: 'exam_training',
      unit: attempt.validatedRegionId || attempt.displayRegionId || attempt.topicDisplayName,
      timestamp: Date.parse(attempt.attemptedAt),
      timeTakenSeconds: attempt.timeSpentSeconds,
      revealedAnswer: attempt.answerRevealedBeforeMarking,
      questions: safeArray(attempt.partScores).length ? safeArray(attempt.partScores).map(function (part) {
        var partQuestionId = [attempt.questionId, part.partId, part.subpartId, part.label].filter(Boolean).join(':') || attempt.questionId;
        var skillNodeIds = [part.skillRef, part.primaryTopicId, part.mappedRegionId, attempt.validatedRegionId, attempt.displayRegionId, attempt.topicDisplayName].filter(Boolean);
        var gainedIds = new Set(safeArray(part.markPointIds));
        return {
          question_id: partQuestionId,
          unit: part.mappedRegionId || attempt.validatedRegionId || attempt.displayRegionId || attempt.topicDisplayName,
          topic: attempt.topicDisplayName,
          regionId: part.mappedRegionId || attempt.validatedRegionId || attempt.displayRegionId,
          mappedRegionId: part.mappedRegionId,
          primaryTopicId: part.primaryTopicId,
          skillRef: part.skillRef,
          skillNodeIds: skillNodeIds,
          skillNodes: skillNodeIds.map(function (id) {
            return {
              id: id,
              label: attempt.topicDisplayName,
              course: 'p3',
              topicId: part.primaryTopicId,
              regionId: part.mappedRegionId || attempt.validatedRegionId || attempt.displayRegionId,
              source: part.skillRef === id ? 'reviewed_skill_map' : part.primaryTopicId === id ? 'topic_route' : 'exam_part'
            };
          }),
          markPoints: safeArray(part.markPointIdsAvailable).map(function (id) {
            return {
              id: id,
              label: part.markPointLabels?.[id] || part.label,
              gained: gainedIds.has(id),
              marks: 1,
              skillNodeIds: skillNodeIds,
              errorType: knowledgeTypeFromTags(attempt.mistakeTypes, attempt.mistakeType),
              evidenceStrength: 0.8
            };
          }),
          marksEarned: part.marksEarned,
          marksAvailable: part.marksAvailable,
          scoreLost: Math.max(0, finiteNonNegative(part.marksAvailable) - finiteNonNegative(part.marksEarned)),
          error_type: normalizeErrorType(attempt.mistakeType, attempt.mistakeTypes),
          mistakeTags: attempt.mistakeTypes
        };
      }) : [{
        question_id: attempt.questionId,
        unit: attempt.validatedRegionId || attempt.displayRegionId || attempt.topicDisplayName,
        topic: attempt.topicDisplayName,
        regionId: attempt.validatedRegionId || attempt.displayRegionId,
        skillNodeIds: [attempt.validatedRegionId, attempt.displayRegionId, attempt.topicDisplayName].filter(Boolean),
        skillNodes: [{
          id: attempt.validatedRegionId || attempt.displayRegionId || attempt.topicDisplayName,
          label: attempt.topicDisplayName,
          course: 'p3',
          regionId: attempt.validatedRegionId || attempt.displayRegionId,
          source: attempt.validatedRegionId || attempt.displayRegionId ? 'topic_route' : 'fallback_region'
        }],
        marksEarned: attempt.marksEarned,
        marksAvailable: attempt.marksAvailable,
        scoreLost: Math.max(0, finiteNonNegative(attempt.marksAvailable) - finiteNonNegative(attempt.marksEarned)),
        error_type: normalizeErrorType(attempt.mistakeType, attempt.mistakeTypes),
        mistakeTags: attempt.mistakeTypes
      }]
    });

    saveProgress(progress);
    if (status) {
      var gateText = attempt.masteryGate === 'skill_check_passed'
        ? 'Clean Checked Practice evidence exists; self-marked exam practice recorded.'
        : 'Exam Training is self-marked practice. It helps you prepare, but it does not replace Checked Practice evidence unless your teacher says so.';
      status.textContent = attempt.trustLabel + '. Self-marked attempt saved. ' + gateText;
      status.setAttribute('data-state', attempt.suspicionFlags.length ? 'warning' : 'saved');
    }
    updateProgressText();
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
      if (stack.closest('[data-p3-diagnostic-form]')) return;
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
      previous.textContent = 'Previous Question';

      var next = document.createElement('button');
      next.className = 'button primary-button';
      next.type = 'button';
      next.textContent = 'Next Question';

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

  function diagnosticQuestionIsComplete(card) {
    var inputs = Array.from(card.querySelectorAll('[data-diagnostic-mark-point]')).filter(function (input) {
      return input instanceof HTMLInputElement;
    });
    return inputs.length > 0 && inputs.every(function (input) {
      return input.value.trim().length > 0;
    });
  }

  function setupP3DiagnosticFlow() {
    document.querySelectorAll('[data-p3-diagnostic-form]').forEach(function (form) {
      if (!(form instanceof HTMLFormElement) || form.getAttribute('data-diagnostic-flow-ready') === 'true') return;
      var cards = Array.from(form.querySelectorAll('[data-diagnostic-question]')).filter(function (card) {
        return card instanceof HTMLElement;
      });
      if (!cards.length) return;

      form.setAttribute('data-diagnostic-flow-ready', 'true');
      var sections = Array.from(form.querySelectorAll('[data-diagnostic-section]')).filter(function (section) {
        return section instanceof HTMLElement;
      });
      var previous = form.querySelector('[data-diagnostic-previous]');
      var next = form.querySelector('[data-diagnostic-next]');
      var submitPanel = form.querySelector('[data-diagnostic-submit-panel]');
      var progressTitle = form.querySelector('[data-diagnostic-progress-title]');
      var progressMessage = form.querySelector('[data-diagnostic-progress-message]');
      var currentSection = form.querySelector('[data-diagnostic-current-section]');
      var index = 0;

      function setIndex(nextIndex, shouldFocus) {
        index = Math.max(0, Math.min(cards.length - 1, nextIndex));
        render(shouldFocus);
      }

      function activeCard() {
        return cards[index];
      }

      function activeSectionId() {
        return activeCard()?.closest('[data-diagnostic-section]')?.getAttribute('data-diagnostic-section') || '';
      }

      function activeQuestionCode() {
        return questionCodeFromCard(activeCard());
      }

      function updateSubmitState(isCurrentComplete) {
        var allComplete = cards.every(diagnosticQuestionIsComplete);
        if (submitPanel instanceof HTMLElement) submitPanel.hidden = !(index === cards.length - 1 && isCurrentComplete && allComplete);
        var submitButton = submitPanel?.querySelector('button[type="submit"]');
        if (submitButton instanceof HTMLButtonElement) submitButton.disabled = !allComplete;
        return allComplete;
      }

      function render(shouldFocus) {
        var currentCard = activeCard();
        var currentSectionId = activeSectionId();
        var isCurrentComplete = currentCard ? diagnosticQuestionIsComplete(currentCard) : false;
        var allComplete = updateSubmitState(isCurrentComplete);

        cards.forEach(function (card, cardIndex) {
          card.hidden = cardIndex !== index;
          card.setAttribute('data-diagnostic-active', cardIndex === index ? 'true' : 'false');
        });
        sections.forEach(function (section) {
          section.hidden = section.getAttribute('data-diagnostic-section') !== currentSectionId;
        });
        form.setAttribute('data-current-section', currentSectionId);

        if (progressTitle) progressTitle.textContent = 'Question ' + (index + 1) + ' of ' + cards.length;
        if (currentSection) currentSection.textContent = activeQuestionCode() || 'Diagnostic question';
        if (progressMessage) {
          progressMessage.textContent = isCurrentComplete
            ? (index === cards.length - 1 ? (allComplete ? 'All questions are complete. Submit when ready.' : 'Finish any earlier unanswered question before submitting.') : 'This question is complete. Continue to the next one.')
            : 'Answer this question to unlock the next one.';
        }
        if (previous instanceof HTMLButtonElement) previous.disabled = index === 0;
        if (next instanceof HTMLButtonElement) {
          next.disabled = !isCurrentComplete || index === cards.length - 1;
          next.textContent = index === cards.length - 1 ? 'Ready to submit' : 'Next question';
        }
        if (shouldFocus && currentCard) {
          if (typeof currentCard.scrollIntoView === 'function') {
            currentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          var firstInput = currentCard.querySelector('[data-diagnostic-mark-point]');
          if (firstInput instanceof HTMLInputElement) firstInput.focus({ preventScroll: true });
        }
      }

      cards.forEach(function (card) {
        card.querySelectorAll('[data-diagnostic-mark-point]').forEach(function (input) {
          input.addEventListener('input', function () {
            render(false);
          });
        });
      });

      if (previous instanceof HTMLButtonElement) {
        previous.addEventListener('click', function () {
          setIndex(index - 1, true);
        });
      }
      if (next instanceof HTMLButtonElement) {
        next.addEventListener('click', function () {
          if (!diagnosticQuestionIsComplete(activeCard())) {
            render(false);
            return;
          }
          setIndex(index + 1, true);
        });
      }

      form.addEventListener('submit', function (event) {
        var firstIncompleteIndex = cards.findIndex(function (card) {
          return !diagnosticQuestionIsComplete(card);
        });
        if (firstIncompleteIndex === -1) return;
        event.preventDefault();
        setIndex(firstIncompleteIndex, true);
      });

      render(false);
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
          link.textContent = heading?.textContent?.trim() || 'Checked Practice';
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
          next.textContent = skillCheckGroups.length > 1 && isCoordinateGeometrySkillCheck ? 'Skip to Next Question' : 'Next Question';
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
              button.textContent = 'Next Question';
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
      previous.textContent = 'Previous Question';

      var label = document.createElement('span');
      label.className = 'practice-count';
      label.setAttribute('aria-live', 'polite');

      var next = document.createElement('button');
      next.className = 'button primary-button';
      next.type = 'button';
      next.textContent = 'Next Question';

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
      var completed = learnCardCompleted(progress, card);
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
      controls.setAttribute('aria-label', 'Learn navigation');

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

      function advanceLearnStep(shouldScroll) {
        if (!currentCardComplete()) {
          render();
          return;
        }
        if (index >= cards.length - 1) {
          if (finalHref) window.location.href = finalHref;
          else next.textContent = 'Completed lesson sequence';
          return;
        }
        index += 1;
        var stepId = cards[index].getAttribute('data-learn-step-id') || '';
        if (stepId) window.history.replaceState(null, '', '#' + stepId);
        render();
        if (shouldScroll && cards[index] instanceof HTMLElement) {
          cards[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      function currentCardComplete() {
        var currentCard = cards[index];
        return currentCard instanceof HTMLElement && learnCardCompleted(loadProgress(), currentCard);
      }

      function render() {
        cards.forEach(function (card, cardIndex) {
          card.hidden = cardIndex !== index;
        });
        var complete = currentCardComplete();
        label.textContent = 'Step ' + (index + 1) + ' of ' + cards.length;
        previous.disabled = index === 0;
        next.disabled = !complete;
        next.setAttribute('aria-disabled', complete ? 'false' : 'true');
        next.textContent = index === cards.length - 1 ? 'Finish lesson sequence' : 'Next step';
        updateLearnModeFlowState();
        cards.forEach(function (card, cardIndex) {
          var footer = card.querySelector('[data-learn-step-footer]');
          var inlineNext = card.querySelector('[data-learn-inline-next]');
          if (footer instanceof HTMLElement) footer.hidden = cardIndex !== index;
          if (inlineNext instanceof HTMLButtonElement) {
            inlineNext.hidden = cardIndex !== index;
            inlineNext.disabled = cardIndex !== index || !complete;
            inlineNext.setAttribute('aria-disabled', cardIndex !== index || !complete ? 'true' : 'false');
            inlineNext.textContent = cardIndex === cards.length - 1 ? 'Finish lesson sequence' : 'Next step';
          }
        });
      }

      previous.addEventListener('click', function () {
        index = Math.max(0, index - 1);
        render();
      });

      next.addEventListener('click', function () {
        advanceLearnStep(false);
      });

      flow.addEventListener('click', function (event) {
        var target = event.target;
        if (!(target instanceof Element) || !target.closest('[data-learn-inline-next]')) return;
        advanceLearnStep(true);
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

  function setupWorksheetFlow() {
    document.querySelectorAll('[data-worksheet-flow]').forEach(function (flow) {
      var groups = Array.from(flow.querySelectorAll('[data-worksheet-group]')).filter(function (group) {
        return group instanceof HTMLElement;
      });
      if (groups.length <= 1 || flow.previousElementSibling?.classList.contains('worksheet-controls')) return;

      var labelText = flow.getAttribute('data-flow-label') || 'Worksheet group';
      var index = 0;
      var switcher = document.createElement('details');
      switcher.className = 'practice-group-switcher worksheet-group-switcher';
      var summary = document.createElement('summary');
      summary.className = 'practice-group-summary';
      var currentGroup = document.createElement('span');
      currentGroup.className = 'practice-current-skill';
      currentGroup.textContent = 'Current group';
      var changeGroup = document.createElement('span');
      changeGroup.className = 'practice-change-skill';
      changeGroup.textContent = 'Change group';
      summary.append(currentGroup, changeGroup);

      var nav = document.createElement('nav');
      nav.className = 'practice-group-nav';
      nav.setAttribute('aria-label', labelText + ' groups');
      groups.forEach(function (group, groupIndex) {
        var link = document.createElement('a');
        var heading = group.querySelector('h2');
        link.className = 'button secondary-button';
        link.href = group.id ? '#' + encodeURIComponent(group.id) : '#';
        link.textContent = heading?.textContent?.trim() || 'Group ' + (groupIndex + 1);
        nav.append(link);
      });
      switcher.append(summary, nav);

      var controls = document.createElement('div');
      controls.className = 'practice-controls worksheet-controls';
      controls.setAttribute('aria-label', labelText + ' navigation');

      var previous = document.createElement('button');
      previous.className = 'button secondary-button';
      previous.type = 'button';
      previous.textContent = 'Previous group';

      var label = document.createElement('span');
      label.className = 'practice-count';
      label.setAttribute('aria-live', 'polite');

      var next = document.createElement('button');
      next.className = 'button primary-button';
      next.type = 'button';
      next.textContent = 'Next group';

      controls.append(previous, label, next);
      flow.before(switcher);
      flow.before(controls);
      flow.classList.add('is-single-worksheet-group');

      function groupIndexFromHash() {
        var hash = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : '';
        if (!hash) return -1;
        return groups.findIndex(function (group) {
          return group.id === hash;
        });
      }

      function setIndex(nextIndex, updateHash) {
        index = Math.max(0, Math.min(groups.length - 1, nextIndex));
        render();
        if (updateHash && groups[index]?.id) {
          window.history.replaceState(null, '', '#' + groups[index].id);
        }
      }

      function render() {
        groups.forEach(function (group, groupIndex) {
          group.hidden = groupIndex !== index;
        });
        label.textContent = 'Group ' + (index + 1) + ' of ' + groups.length;
        previous.disabled = index === 0;
        next.disabled = index === groups.length - 1;
        currentGroup.textContent = groups[index]?.querySelector('h2')?.textContent?.trim() || 'Group ' + (index + 1);
        Array.from(nav.querySelectorAll('a[href^="#"]')).forEach(function (link, linkIndex) {
          if (linkIndex === index) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      }

      nav.addEventListener('click', function (event) {
        var target = event.target;
        if (!(target instanceof Element)) return;
        var link = target.closest('a[href^="#"]');
        if (!(link instanceof HTMLAnchorElement)) return;
        var targetId = decodeURIComponent((link.getAttribute('href') || '').replace(/^#/, ''));
        var targetIndex = groups.findIndex(function (group) {
          return group.id === targetId;
        });
        if (targetIndex < 0) return;
        event.preventDefault();
        switcher.open = false;
        setIndex(targetIndex, true);
      });

      previous.addEventListener('click', function () {
        setIndex(index - 1, true);
      });

      next.addEventListener('click', function () {
        setIndex(index + 1, true);
      });

      window.addEventListener('hashchange', function () {
        var hashIndex = groupIndexFromHash();
        if (hashIndex >= 0) setIndex(hashIndex, false);
      });

      var initialIndex = groupIndexFromHash();
      setIndex(initialIndex >= 0 ? initialIndex : 0, false);
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
        if (next) next.textContent = bounded === tabs.length - 1 ? 'Checked Practice' : 'Next subtopic';
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
          status.textContent = state === 'locked' ? 'Locked' : state === 'active' ? 'Active' : state === 'correct' ? 'Correct' : 'Try Again';
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
        showCorrectCelebration({
          title: nextStep ? 'Correct' : 'Demo complete',
          message: result.message,
          primaryLabel: nextStep ? 'Next step' : 'Close',
          onPrimary: nextStep
            ? function () {
              var targetTextarea = nextStep.querySelector('textarea');
              if (targetTextarea instanceof HTMLElement) targetTextarea.focus({ preventScroll: true });
            }
            : undefined
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('static-enhanced');
    setupThemeToggle();
    setupHomepageDemo();
    setupProgressTransferControls();
    setupProgressExportForms();
    setupP3DiagnosticFlow();
    setupPracticeStacks();
    setupOneCardFlow();
    setupExamQuestionFlow();
    setupLearnModeFlow();
    setupWorksheetFlow();
    setupExamSelfMarking();
    setupGuidedStudy();
    setupP1RepairLaneFlow();
    updateProgressText();
    renderReviewPage();

    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var exportProgressButton = target.closest('[data-export-progress-json]');
      if (exportProgressButton) {
        exportProgressJsonDownload();
        return;
      }

      var importProgressButton = target.closest('[data-import-progress-json]');
      if (importProgressButton) {
        var importInput = document.querySelector('[data-import-progress-file-input]');
        if (importInput instanceof HTMLInputElement) importInput.click();
        return;
      }

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

      var tryLearnSimilarButton = target.closest('[data-try-learn-similar]');
      if (tryLearnSimilarButton instanceof HTMLElement) {
        openLearnSimilarPanel(tryLearnSimilarButton);
        return;
      }

      var retryLearnPrimaryButton = target.closest('[data-retry-learn-primary]');
      if (retryLearnPrimaryButton instanceof HTMLElement) {
        retryLearnPrimaryQuestion(retryLearnPrimaryButton);
        return;
      }

      var copyExportButton = target.closest('[data-copy-export-csv]');
      if (copyExportButton) {
        var panel = copyExportButton.closest('[data-export-panel]');
        var csvOutput = panel?.querySelector('[data-export-csv-output]');
        if (csvOutput instanceof HTMLTextAreaElement) {
          csvOutput.select();
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(csvOutput.value).then(function () {
              setExportStatus(panel, 'CSV copied. Paste it into the email message before sending.');
            }).catch(function () {
              document.execCommand('copy');
              setExportStatus(panel, 'CSV selected. Copy it, then paste it into the email message before sending.');
            });
          } else {
            document.execCommand('copy');
            setExportStatus(panel, 'CSV selected. Copy it, then paste it into the email message before sending.');
          }
        }
        return;
      }

      var downloadExportButton = target.closest('[data-download-export-csv]');
      if (downloadExportButton) {
        var exportForm = downloadExportButton.closest('[data-export-local-progress-form]');
        if (exportForm instanceof HTMLFormElement) exportLocalProgressDownload(exportForm);
        return;
      }

      var p1ModuleTab = target.closest('[data-p1-repair-module-tab]');
      if (p1ModuleTab) {
        setActiveP1RepairModule(p1ModuleTab.getAttribute('data-p1-repair-module-tab') || '', true);
        return;
      }

      var p1NextButton = target.closest('[data-p1-repair-next]');
      if (p1NextButton) {
        var currentCard = p1NextButton.closest('[data-p1-repair-module]');
        var currentId = currentCard ? currentCard.getAttribute('data-p1-repair-module') || '' : '';
        setActiveP1RepairModule(nextP1RepairModuleId(currentId), true);
        document.getElementById('repair-modules')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        return;
      }
      if (form.matches('[data-p3-diagnostic-form]')) {
        if (event.defaultPrevented) return;
        event.preventDefault();
        submitP3Diagnostic(form);
        return;
      }
      if (form.matches('[data-export-local-progress-form]')) {
        event.preventDefault();
        exportLocalProgressEmail(form);
        return;
      }
      if (form.matches('[data-p1-repair-module-form]')) {
        event.preventDefault();
        submitP1RepairModule(form, event.submitter);
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
