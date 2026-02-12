import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Eye, ArrowLeft } from 'lucide-react';
import { DRILL_CATEGORIES, CATEGORY_COLORS, DIFFICULTY_LEVELS, AGE_GROUPS, EQUIPMENT_OPTIONS, TAG_OPTIONS } from '../../constants/drills';
import PageShell from '../PageShell';

const FUN_EMOJIS = ['😐', '🙂', '😊', '😄', '🤩'];

const DrillForm = ({ initialData, onSubmit, title, backPath = '/drills' }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'ball-handling',
    ageGroups: [],
    difficulty: 1,
    duration: 10,
    minPlayers: 2,
    maxPlayers: 12,
    equipment: [],
    setup: '',
    instructions: [''],
    variations: [],
    coachingPoints: [''],
    videoUrl: '',
    skillsFocus: [],
    funRating: 3,
    tags: [],
    ...initialData
  });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleArrayItem = (field, item) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  // Dynamic list helpers
  const addListItem = (field) => setForm(prev => ({
    ...prev, [field]: [...prev[field], '']
  }));
  const updateListItem = (field, index, value) => setForm(prev => ({
    ...prev, [field]: prev[field].map((item, i) => i === index ? value : item)
  }));
  const removeListItem = (field, index) => setForm(prev => ({
    ...prev, [field]: prev[field].filter((_, i) => i !== index)
  }));
  const moveListItem = (field, index, direction) => {
    setForm(prev => {
      const arr = [...prev[field]];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return { ...prev, [field]: arr };
    });
  };

  // Variation helpers
  const addVariation = () => setForm(prev => ({
    ...prev, variations: [...prev.variations, { name: '', description: '' }]
  }));
  const updateVariation = (index, field, value) => setForm(prev => ({
    ...prev, variations: prev.variations.map((v, i) => i === index ? { ...v, [field]: value } : v)
  }));
  const removeVariation = (index) => setForm(prev => ({
    ...prev, variations: prev.variations.filter((_, i) => i !== index)
  }));

  const addSkill = () => {
    if (skillInput.trim() && !form.skillsFocus.includes(skillInput.trim())) {
      updateField('skillsFocus', [...form.skillsFocus, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanedForm = {
        ...form,
        instructions: form.instructions.filter(i => i.trim()),
        coachingPoints: form.coachingPoints.filter(c => c.trim()),
        videoUrl: form.videoUrl?.trim() || null,
        duration: Number(form.duration),
        minPlayers: Number(form.minPlayers),
        maxPlayers: Number(form.maxPlayers),
        funRating: Number(form.funRating),
        difficulty: Number(form.difficulty),
      };
      await onSubmit(cleanedForm);
    } finally {
      setSaving(false);
    }
  };

  const currentDiffLevel = DIFFICULTY_LEVELS[form.difficulty] || DIFFICULTY_LEVELS[1];

  if (preview) {
    const previewDiff = DIFFICULTY_LEVELS[form.difficulty] || DIFFICULTY_LEVELS[1];
    const previewCat = DRILL_CATEGORIES[form.category];
    const previewColor = CATEGORY_COLORS[previewCat?.color] || CATEGORY_COLORS.blue;
    return (
      <PageShell title="Preview Drill" backPath={null}>
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setPreview(false)} className="mb-4 text-sm text-[#00A651] hover:text-[#005028] font-medium flex items-center gap-1">
            <Eye className="w-4 h-4" /> Back to Editor
          </button>
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-6 space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">{form.name || 'Untitled Drill'}</h1>
            <p className="text-[#6B7C6B]">{form.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${previewColor.badge}`}>
                {previewCat?.label}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${previewDiff.badge}`}>
                {previewDiff.short} — {previewDiff.label}
              </span>
              <span className="px-3 py-1 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full text-sm">{form.duration} min</span>
            </div>
            {form.instructions.filter(i => i.trim()).length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Instructions</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  {form.instructions.filter(i => i.trim()).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {form.coachingPoints.filter(c => c.trim()).length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Coaching Points</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {form.coachingPoints.filter(c => c.trim()).map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={title} backPath={backPath}>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        {/* Name & Description */}
        <Section title="Basic Info">
          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Drill Name *</span>
            <input
              type="text"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
              placeholder="e.g. Zigzag Dribble"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Description *</span>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              required
              rows={3}
              className="mt-1 w-full px-4 py-3 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none resize-none"
              placeholder="Brief description of the drill..."
            />
          </label>
        </Section>

        {/* Category & Difficulty */}
        <Section title="Classification">
          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Skill Category *</span>
            <select
              value={form.category}
              onChange={e => updateField('category', e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none bg-white"
            >
              {Object.entries(DRILL_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.label}</option>
              ))}
            </select>
          </label>

          {/* Difficulty Level — 1-4 buttons matching assessment scale */}
          <div>
            <span className="text-sm font-medium text-gray-700">Difficulty Level *</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {Object.entries(DIFFICULTY_LEVELS).map(([level, info]) => {
                const numLevel = Number(level);
                const isSelected = form.difficulty === numLevel;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateField('difficulty', numLevel)}
                    className={`px-3 py-3 rounded-lg text-sm font-semibold border-2 transition-all ${
                      isSelected
                        ? `${info.bg} ${info.text} border-transparent ring-2 ring-[#00A651] ring-offset-1`
                        : 'bg-white text-gray-600 border-[#D4E4D4] hover:border-[#00A651]'
                    }`}
                  >
                    <div className="text-xs opacity-70">{info.short}</div>
                    <div>{info.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Age Groups */}
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-700">Age Groups *</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {AGE_GROUPS.map(ag => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => toggleArrayItem('ageGroups', ag)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.ageGroups.includes(ag)
                      ? 'bg-[#005028] text-white border-[#005028]'
                      : 'bg-white text-gray-600 border-[#D4E4D4] hover:border-[#00A651]'
                  }`}
                >
                  {ag.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Duration & Players */}
        <Section title="Logistics">
          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Duration (min)</span>
              <input
                type="number"
                min={1}
                max={60}
                value={form.duration}
                onChange={e => updateField('duration', e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Min Players</span>
              <input
                type="number"
                min={1}
                max={30}
                value={form.minPlayers}
                onChange={e => updateField('minPlayers', e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Max Players</span>
              <input
                type="number"
                min={1}
                max={30}
                value={form.maxPlayers}
                onChange={e => updateField('maxPlayers', e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
              />
            </label>
          </div>

          {/* Equipment */}
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-700">Equipment</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {EQUIPMENT_OPTIONS.map(eq => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleArrayItem('equipment', eq)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.equipment.includes(eq)
                      ? 'bg-[#00A651] text-white border-[#00A651]'
                      : 'bg-white text-gray-600 border-[#D4E4D4] hover:border-[#00A651]'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Setup */}
        <Section title="Setup">
          <textarea
            value={form.setup}
            onChange={e => updateField('setup', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none resize-none"
            placeholder="Describe the court layout and starting positions..."
          />
        </Section>

        {/* Instructions */}
        <Section title="Instructions (Step-by-Step)">
          <div className="space-y-2">
            {form.instructions.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-7 h-10 flex items-center justify-center text-sm font-bold text-[#6B7C6B]">{i + 1}.</span>
                <input
                  type="text"
                  value={step}
                  onChange={e => updateListItem('instructions', i, e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm"
                  placeholder={`Step ${i + 1}...`}
                />
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveListItem('instructions', i, -1)} className="p-1 text-gray-400 hover:text-gray-600" disabled={i === 0}>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveListItem('instructions', i, 1)} className="p-1 text-gray-400 hover:text-gray-600" disabled={i === form.instructions.length - 1}>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <button type="button" onClick={() => removeListItem('instructions', i)} className="p-2 text-red-400 hover:text-red-600" disabled={form.instructions.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addListItem('instructions')} className="mt-2 text-sm text-[#00A651] hover:text-[#005028] font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Step
          </button>
        </Section>

        {/* Coaching Points */}
        <Section title="Coaching Points">
          <div className="space-y-2">
            {form.coachingPoints.map((pt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-shrink-0 text-[#FFD700]">💡</span>
                <input
                  type="text"
                  value={pt}
                  onChange={e => updateListItem('coachingPoints', i, e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm"
                  placeholder="Coaching point..."
                />
                <button type="button" onClick={() => removeListItem('coachingPoints', i)} className="p-2 text-red-400 hover:text-red-600" disabled={form.coachingPoints.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addListItem('coachingPoints')} className="mt-2 text-sm text-[#00A651] hover:text-[#005028] font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Point
          </button>
        </Section>

        {/* Variations */}
        <Section title="Variations">
          <div className="space-y-3">
            {form.variations.map((v, i) => (
              <div key={i} className="p-4 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Variation {i + 1}</span>
                  <button type="button" onClick={() => removeVariation(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={v.name}
                  onChange={e => updateVariation(i, 'name', e.target.value)}
                  className="w-full mb-2 px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm"
                  placeholder="Variation name..."
                />
                <textarea
                  value={v.description}
                  onChange={e => updateVariation(i, 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm resize-none"
                  placeholder="Description..."
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={addVariation} className="mt-2 text-sm text-[#00A651] hover:text-[#005028] font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Variation
          </button>
        </Section>

        {/* Skills Focus */}
        <Section title="Skills Focus">
          <div className="flex flex-wrap gap-2 mb-2">
            {form.skillsFocus.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-[#005028]/10 text-[#005028] rounded-full text-sm font-medium flex items-center gap-1">
                {skill}
                <button type="button" onClick={() => updateField('skillsFocus', form.skillsFocus.filter((_, idx) => idx !== i))} className="ml-1 text-red-400 hover:text-red-600">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              className="flex-1 px-4 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm"
              placeholder="Type a skill and press Enter..."
            />
            <button type="button" onClick={addSkill} className="px-4 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-sm text-gray-600 hover:bg-[#D4E4D4]">Add</button>
          </div>
        </Section>

        {/* Tags */}
        <Section title="Tags">
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleArrayItem('tags', tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.tags.includes(tag)
                    ? 'bg-[#005028] text-white border-[#005028]'
                    : 'bg-white text-gray-600 border-[#D4E4D4] hover:border-[#00A651]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </Section>

        {/* Fun Rating & Video */}
        <Section title="Fun Rating & Video">
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Fun Rating</span>
            <div className="flex items-center gap-3 mt-2">
              {FUN_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateField('funRating', i + 1)}
                  className={`w-12 h-12 rounded-xl text-2xl border-2 transition-all ${
                    form.funRating === i + 1
                      ? 'border-[#FFD700] bg-[#FFD700]/10 scale-110'
                      : 'border-[#D4E4D4] hover:border-[#FFD700]/50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Video URL (optional)</span>
            <input
              type="url"
              value={form.videoUrl || ''}
              onChange={e => updateField('videoUrl', e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
              placeholder="https://youtube.com/..."
            />
          </label>
        </Section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#D4E4D4]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="px-6 py-3 border border-red-200 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="px-6 py-3 border border-[#D4E4D4] rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
          </div>
          <button
            type="submit"
            disabled={saving || !form.name || !form.description || form.ageGroups.length === 0}
            className="px-8 py-3 bg-[#005028] text-white rounded-lg font-semibold hover:bg-[#003018] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : (initialData ? 'Update Drill' : 'Create Drill')}
          </button>
        </div>
      </form>
    </PageShell>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-[#D4E4D4] p-5">
    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">{title}</h3>
    {children}
  </div>
);

export default DrillForm;
