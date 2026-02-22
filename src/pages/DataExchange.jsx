// this page is for data exchange between candidates and admins
import { useParams } from "react-router-dom";
import DataExchangeLoading from "./dataExchange/components/DataExchangeLoading";
import DataExchangeNotFound from "./dataExchange/components/DataExchangeNotFound";
import CandidateIntroCard from "./dataExchange/components/CandidateIntroCard";
import DocumentExchangeList from "./dataExchange/components/DocumentExchangeList";
import { useDataExchange } from "./dataExchange/hooks/useDataExchange";

function DataExchange() {
  const { id } = useParams();
  const {
    loading,
    notFound,
    candidateName,
    outgoingEntries,
    incomingDocs,
    uploadingDocs,
    deletingDocs,
    allowDelete,
    handleFileUpload,
    handleFileDelete,
    handleDownload,
  } = useDataExchange(id);

  if (loading) {
    return <DataExchangeLoading />;
  }

  if (notFound) {
    return <DataExchangeNotFound id={id} />;
  }

  return (
    <div
      className="min-h-screen bg-base-200 py-4 sm:py-8 px-3 sm:px-4"
      data-theme="winter"
    >
      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-primary">
              Hujjatlar almashinuvi
            </h1>

            <CandidateIntroCard candidateName={candidateName} />

            <DocumentExchangeList
              outgoingEntries={outgoingEntries}
              incomingDocs={incomingDocs}
              uploadingDocs={uploadingDocs}
              deletingDocs={deletingDocs}
              allowDelete={allowDelete}
              onDownload={handleDownload}
              onDelete={handleFileDelete}
              onUpload={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataExchange;
