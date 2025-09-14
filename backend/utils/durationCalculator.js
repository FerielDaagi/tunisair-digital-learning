const Lesson = require('../models/Lesson');
const Module = require('../models/Module');

// Convert strings like "15 minutes", "1 heure 30 minutes", "2h", "45m" to total minutes
const parseDurationToMinutes = (rawDuration) => {
  if (!rawDuration || typeof rawDuration !== 'string') return 0;
  const s = rawDuration.trim().toLowerCase();

  // Quick numeric only (assume minutes)
  if (/^\d+$/.test(s)) return parseInt(s, 10);

  let hours = 0;
  let minutes = 0;

  // Patterns for hours
  const hourMatch = s.match(/(\d+)\s*(?:h|heure|heures)/);
  if (hourMatch) hours = parseInt(hourMatch[1], 10) || 0;

  // Patterns for minutes
  const minuteMatch = s.match(/(\d+)\s*(?:m|min|minute|minutes)/);
  if (minuteMatch) minutes = parseInt(minuteMatch[1], 10) || 0;

  // Handle cases like "1:30"
  if (!hourMatch && !minuteMatch) {
    const colon = s.match(/^(\d+)\s*[:]\s*(\d{1,2})$/);
    if (colon) {
      hours = parseInt(colon[1], 10) || 0;
      minutes = parseInt(colon[2], 10) || 0;
    }
  }

  // Handle single like "2h" or "45m"
  if (!hourMatch && !minuteMatch) {
    const hOnly = s.match(/^(\d+)\s*h$/);
    const mOnly = s.match(/^(\d+)\s*m(?:in)?$/);
    if (hOnly) hours = parseInt(hOnly[1], 10) || 0;
    if (mOnly) minutes = parseInt(mOnly[1], 10) || 0;
  }

  return hours * 60 + minutes;
};

// Convert minutes to a human-friendly French string: "X heures Y minutes" or "X heure" / "Y minutes"
const formatMinutesToDuration = (totalMinutes) => {
  const minutesInt = Number.isFinite(totalMinutes) ? Math.max(0, Math.floor(totalMinutes)) : 0;
  const h = Math.floor(minutesInt / 60);
  const m = minutesInt % 60;

  if (h > 0 && m > 0) return `${h} ${h > 1 ? 'heures' : 'heure'} ${m} ${m > 1 ? 'minutes' : 'minute'}`;
  if (h > 0) return `${h} ${h > 1 ? 'heures' : 'heure'}`;
  return `${m} ${m > 1 ? 'minutes' : 'minute'}`;
};

// Recompute and update a module's estimatedDuration from its lessons' durations
const updateModuleDuration = async (moduleId) => {
  try {
    if (!moduleId) return false;

    const lessons = await Lesson.find({ module: moduleId });
    let totalMinutes = 0;
    for (const lesson of lessons) {
      totalMinutes += parseDurationToMinutes(lesson.duration || '');
    }

    const formatted = formatMinutesToDuration(totalMinutes);
    await Module.findByIdAndUpdate(moduleId, { estimatedDuration: formatted });
    return true;
  } catch (err) {
    console.error('Erreur updateModuleDuration:', err);
    return false;
  }
};

module.exports = {
  parseDurationToMinutes,
  formatMinutesToDuration,
  updateModuleDuration,
};











