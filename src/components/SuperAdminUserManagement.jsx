import { FiRefreshCw } from "react-icons/fi";
import useUserManagement from "./superAdmin/hooks/useUserManagement";
import CreateUserForm from "./superAdmin/components/CreateUserForm";
import UserTable from "./superAdmin/components/UserTable";
import PasswordModal from "./superAdmin/components/PasswordModal";

function SuperAdminUserManagement() {
  const {
    email, setEmail,
    password, setPassword,
    showCreatePassword, setShowCreatePassword,
    loading,
    users,
    roleDrafts,
    pwModalUser,
    pw1, setPw1,
    pw2, setPw2,
    showPw1, setShowPw1,
    showPw2, setShowPw2,
    loadUsers,
    handleCreateUser,
    handleRoleChange,
    handleSetRole,
    handleDisable,
    handleEnable,
    handleDelete,
    openPwModal,
    closePwModal,
    handlePwSubmit,
  } = useUserManagement();

  return (
    <div className="space-y-4 relative">
      {loading && (
        <div className="absolute inset-0 z-10 rounded-box bg-base-100/60 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 px-4 py-3 shadow">
            <span className="loading loading-spinner loading-md" />
            <span className="text-sm">Bitte warten...</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Benutzerverwaltung</h2>
        <button
          type="button"
          className={`btn btn-sm btn-outline btn-square ${loading ? "btn-disabled" : ""}`}
          onClick={() => loadUsers()}
          disabled={loading}
          aria-label="Aktualisieren"
          title="Aktualisieren"
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <FiRefreshCw size={16} />
          )}
        </button>
      </div>

      <CreateUserForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showCreatePassword={showCreatePassword}
        setShowCreatePassword={setShowCreatePassword}
        loading={loading}
        handleCreateUser={handleCreateUser}
      />

      <UserTable
        users={users}
        roleDrafts={roleDrafts}
        loading={loading}
        handleRoleChange={handleRoleChange}
        handleSetRole={handleSetRole}
        handleDisable={handleDisable}
        handleEnable={handleEnable}
        handleDelete={handleDelete}
        openPwModal={openPwModal}
      />

      <PasswordModal
        pwModalUser={pwModalUser}
        pw1={pw1}
        setPw1={setPw1}
        pw2={pw2}
        setPw2={setPw2}
        showPw1={showPw1}
        setShowPw1={setShowPw1}
        showPw2={showPw2}
        setShowPw2={setShowPw2}
        loading={loading}
        handlePwSubmit={handlePwSubmit}
        closePwModal={closePwModal}
      />
    </div>
  );
}

export default SuperAdminUserManagement;
