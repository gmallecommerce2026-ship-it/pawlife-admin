// src/app/shelter/pets/[id]/edit/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PetForm } from '@/modules/shelter/pets/components/PetForm';
import { usePetActions } from '@/stores/usePetStore';
import { Pet } from '@/types/pet';

export default function EditPetPage() {
  const params = useParams<{ id: string }>();
  const { getPetById } = usePetActions();
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await getPetById(params.id);
        if (mounted) {
          setPet(result);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[EditPetPage] Fetch warning:', err);
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (isLoading) {
    return <div className="w-full max-w-[900px] py-20 text-center text-gray-400 font-sans">Đang tải thông tin pet...</div>;
  }

  return <PetForm mode="edit" initialPet={pet} />;
}