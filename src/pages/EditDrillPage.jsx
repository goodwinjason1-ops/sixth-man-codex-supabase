import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDrill, updateDrill } from '../services/drillService';
import DrillForm from '../components/drills/DrillForm';
import PageShell from '../components/PageShell';

const EditDrillPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drill, setDrill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrill(id).then(data => {
      setDrill(data);
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (drillData) => {
    await updateDrill(id, drillData);
    navigate(`/drills/${id}`);
  };

  if (loading) {
    return (
      <PageShell title="Loading..." backPath="/drills">
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageShell>
    );
  }

  if (!drill) {
    return (
      <PageShell title="Not Found" backPath="/drills">
        <div className="text-center py-20">
          <h3 className="text-lg font-bold text-gray-800">Drill not found</h3>
        </div>
      </PageShell>
    );
  }

  return (
    <DrillForm
      title="Edit Drill"
      backPath={`/drills/${id}`}
      initialData={drill}
      onSubmit={handleSubmit}
    />
  );
};

export default EditDrillPage;
