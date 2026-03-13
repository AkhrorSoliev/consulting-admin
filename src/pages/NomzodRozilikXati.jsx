import { useNomzodRozilikXatiTemplate } from "./nomzodRozilikXati/hooks/useNomzodRozilikXatiTemplate";
import ActionBar from "./nomzodRozilikXati/components/ActionBar";
import NomzodRozilikXatiForm from "./nomzodRozilikXati/components/NomzodRozilikXatiForm";
import NomzodRozilikXatiLivePreview from "./contract/components/NomzodRozilikXatiLivePreview";

export default function NomzodRozilikXati() {
  const t = useNomzodRozilikXatiTemplate();

  const layoutClass =
    "flex flex-col lg:flex-row gap-6 items-start lg:items-stretch";
  const formCard =
    "card bg-base-100 shadow-2xl border border-base-300 rounded-2xl w-full lg:max-w-[520px] shrink-0 max-h-[calc(100vh-2rem)] lg:sticky lg:top-2 overflow-y-auto";

  return (
    <div className="p-2 min-h-screen">
      <ActionBar {...t} />
      <div className={layoutClass}>
        <section className={formCard}>
          <NomzodRozilikXatiForm form={t.form} setForm={t.setForm} />
        </section>
        <NomzodRozilikXatiLivePreview form={t.form} />
      </div>
    </div>
  );
}
