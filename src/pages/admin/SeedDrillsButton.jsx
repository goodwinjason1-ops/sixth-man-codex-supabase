import React, { useState } from 'react';
import { BookOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { seedDrills } from '../../services/drillService';
import seedDrillsData from '../../data/seedDrills';

const SeedDrillsButton = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSeed = async () => {
    setLoading(true);
    setError('');
    try {
      const ids = await seedDrills(seedDrillsData);
      setDone(true);
      console.log(`Seeded ${ids.length} drills`);
    } catch (err) {
      setError(err.message);
      console.error('Seed error:', err);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
        <CheckCircle2 className="w-5 h-5" />
        {seedDrillsData.length} drills seeded successfully!
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleSeed}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-3 bg-[#005028] text-white rounded-lg font-medium text-sm hover:bg-[#003018] transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
        {loading ? `Seeding ${seedDrillsData.length} drills...` : `Seed ${seedDrillsData.length} Drills`}
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default SeedDrillsButton;
