import EditorFormBody from "./editorContent/EditorFormBody";
import EditorSidePanels from "./editorContent/EditorSidePanels";

export default function GenerateEditorContent(props) {
  const { loading, notFound, layoutClass, formSectionClass } = props;

  return (
    <div className="w-full">
      {loading ? (
        <div className="grid place-items-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : notFound ? (
        <div className="py-16 text-center bg-base-100 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Nicht gefunden</h2>
          <p className="opacity-70">Das Dokument existiert nicht oder wurde gelöscht.</p>
        </div>
      ) : (
        <>
          <div className={layoutClass}>
            <section className={formSectionClass}>
              <EditorFormBody {...props} />
            </section>

            <EditorSidePanels {...props} />
          </div>
        </>
      )}
    </div>
  );
}
