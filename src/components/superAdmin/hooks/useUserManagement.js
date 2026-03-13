import { useCallback, useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";
import { functions } from "../../../firebase/config";
import useUserActions from "./useUserActions";

export const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "limited_admin", label: "Limited Admin" },
  { value: "user", label: "User" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sortByCreatedDesc(list) {
  const toTs = (item) => {
    if (Number.isFinite(item?.createdAtTs)) return item.createdAtTs;
    const t = Date.parse(item?.createdAt);
    return Number.isFinite(t) ? t : 0;
  };
  return [...list].sort((a, b) => toTs(b) - toTs(a));
}

const call = (name) => httpsCallable(functions, name);

export default function useUserManagement() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roleDrafts, setRoleDrafts] = useState({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await call("listUsers")({ pageSize: 100 });
      const payload = res?.data || {};
      const list = Array.isArray(payload.users) ? payload.users : [];
      const visible = sortByCreatedDesc(
        list.filter((u) => u.role !== "super_admin")
      );
      setUsers(visible);
      setRoleDrafts(() => {
        const next = {};
        visible.forEach((u) => {
          next[u.uid] = u.role || "user";
        });
        return next;
      });
      return visible;
    } catch (err) {
      toast.error(err?.message || "Benutzerliste konnte nicht geladen werden.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const actions = useUserActions({ roleDrafts, setRoleDrafts, setLoading, loadUsers });

  const handleCreateUser = async (event) => {
    event.preventDefault();
    const e = String(email || "").trim();
    const p = String(password || "");
    if (!e || !p) {
      toast.error("E-Mail und Passwort sind erforderlich.");
      return;
    }
    setLoading(true);
    try {
      const res = await call("createUser")({ email: e, password: p });
      const createdUid = String(res?.data?.uid || "").trim();
      const createdEmail = String(res?.data?.email || e).trim();

      if (createdUid) {
        const nowIso = new Date().toISOString();
        const optimisticUser = {
          uid: createdUid,
          email: createdEmail,
          disabled: false,
          role: "user",
          createdAt: nowIso,
          createdAtTs: Date.now(),
        };
        setUsers((prev) => sortByCreatedDesc([...prev, optimisticUser]));
        setRoleDrafts((prev) => ({ ...prev, [createdUid]: "user" }));
      }

      toast.success(`Benutzer erstellt: ${createdEmail || e}`);
      setEmail("");
      setPassword("");
      setShowCreatePassword(false);

      if (createdUid) {
        for (let attempt = 0; attempt < 4; attempt++) {
          const list = await loadUsers();
          if (Array.isArray(list) && list.some((u) => u?.uid === createdUid))
            break;
          await sleep(500);
        }
      } else {
        await loadUsers();
      }
    } catch (err) {
      toast.error(err?.message || "Benutzer konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    showCreatePassword, setShowCreatePassword,
    loading,
    users,
    roleDrafts,
    loadUsers,
    handleCreateUser,
    ...actions,
  };
}
