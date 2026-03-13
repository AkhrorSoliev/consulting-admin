import React from "react";
import LimitedAdminCommentSection from "./LimitedAdminCommentSection";
import AdminCommentSection from "./AdminCommentSection";

export default function CommentSection(props) {
  if (props.isLimitedAdmin) {
    return <LimitedAdminCommentSection {...props} />;
  }

  return <AdminCommentSection {...props} />;
}
