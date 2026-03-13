import { useCrudHandlers } from "./useCrudHandlers";
import { useSkillsHandlers } from "./useSkillsHandlers";

export function useFormHandlers(
  formCv,
  setFormCv,
  setRecentlyAdded,
  isLimitedAdmin
) {
  const crud = useCrudHandlers(formCv, setFormCv, isLimitedAdmin);
  const skills = useSkillsHandlers(
    formCv,
    setFormCv,
    setRecentlyAdded,
    isLimitedAdmin
  );

  return {
    ...crud,
    ...skills,
  };
}
