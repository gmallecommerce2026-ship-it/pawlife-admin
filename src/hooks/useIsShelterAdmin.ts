import { useEffect, useState } from 'react';
import { useShelterTeam } from '@/store/useShelterTeamStore';
import { getUserFromToken } from '@/utils/getUserFromToken';

export const useIsShelterAdmin = () => {
  const { me } = useShelterTeam();
  const [tokenRole, setTokenRole] = useState<string | undefined>();

  useEffect(() => {
    const u: any = getUserFromToken();
    setTokenRole(u?.shelterRole);
  }, []);

  return (me?.shelterRole ?? tokenRole) === 'ADMIN';
};