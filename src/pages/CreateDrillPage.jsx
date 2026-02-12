import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createDrill } from '../services/drillService';
import DrillForm from '../components/drills/DrillForm';

const CreateDrillPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmit = async (drillData) => {
    const id = await createDrill({
      ...drillData,
      createdBy: currentUser.uid
    });
    navigate(`/drills/${id}`);
  };

  return (
    <DrillForm
      title="Create New Drill"
      backPath="/drills"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Drill Library', url: '/drills' },
        { label: 'Create New Drill' }
      ]}
      onSubmit={handleSubmit}
    />
  );
};

export default CreateDrillPage;
