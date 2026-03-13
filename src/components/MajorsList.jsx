import LinkCopyModal from "./LinkCopyModal";
import MajorSettingsModal from "./MajorSettingsModal";
import { buildCreateLink } from "./majorsHelpers";
import { DeleteMajorModal, MajorListItem, useMajorsData } from "./majorsList/index";

export default function MajorsList() {
  const {
    filteredMajors,
    serverCounts,
    loadingCounts,
    togglingMajorId,
    setSettingsMajor,
    linkCopyModal,
    setLinkCopyModal,
    deleteMajorModal,
    setDeleteMajorModal,
    isLimitedAdmin,
    isSettingsOpen,
    settingsMajorKey,
    currentSettingsMajor,
    handleCopyLink,
    handleDeleteMajor,
    handleToggleCreateLink,
  } = useMajorsData();

  return (
    <div>
      <LinkCopyModal
        open={linkCopyModal.open}
        onClose={() => setLinkCopyModal({ open: false, major: null })}
        regularLink={
          linkCopyModal.major ? buildCreateLink(linkCopyModal.major) : ""
        }
        majorCode={
          linkCopyModal.major
            ? linkCopyModal.major?.linkId ||
              linkCopyModal.major?.uuid ||
              linkCopyModal.major?.id ||
              linkCopyModal.major?.collectionName ||
              linkCopyModal.major
            : ""
        }
      />
      <DeleteMajorModal
        deleteMajorModal={deleteMajorModal}
        setDeleteMajorModal={setDeleteMajorModal}
        onDelete={handleDeleteMajor}
      />
      {!isLimitedAdmin ? (
        <MajorSettingsModal
          open={isSettingsOpen}
          major={currentSettingsMajor}
          majorKey={settingsMajorKey}
          isTogglingLink={Boolean(
            settingsMajorKey && togglingMajorId === settingsMajorKey,
          )}
          onClose={() => setSettingsMajor(null)}
          onCopyLink={() => handleCopyLink(currentSettingsMajor)}
          onToggleLinkActive={(checked) =>
            handleToggleCreateLink(currentSettingsMajor, checked)
          }
        />
      ) : null}
      {filteredMajors.length === 0 ? (
        <div className="text-center opacity-70 py-8 text-sm">
          <p>Derzeit keine Berufsfelder vorhanden.</p>
          <p className="mt-1">
            Klicken Sie auf &bdquo;Neues Berufsfeld&ldquo;, um zu beginnen.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredMajors.map((major) => {
            const linkId =
              major?.linkId ||
              major?.uuid ||
              major?.id ||
              major?.collectionName ||
              major;
            return (
              <MajorListItem
                key={linkId}
                major={major}
                serverCounts={serverCounts}
                loadingCounts={loadingCounts}
                isLimitedAdmin={isLimitedAdmin}
                onCopyLink={handleCopyLink}
                onDelete={(m) =>
                  setDeleteMajorModal({
                    open: true,
                    major: m,
                    deleting: false,
                  })
                }
                onOpenSettings={setSettingsMajor}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
