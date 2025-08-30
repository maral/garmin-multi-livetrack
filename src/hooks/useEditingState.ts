import { useState } from "react";

export const useEditingState = (initialUrls: string[] = []) => {
  const [urls, setUrls] = useState<string>(initialUrls.join("\n"));
  const [originalUrls, setOriginalUrls] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setUrls(originalUrls);
    setIsEditing(false);
  };

  const resetForm = () => {
    setUrls("");
    setOriginalUrls("");
    setIsEditing(false);
  };

  const saveOriginalUrls = (urlString: string) => {
    setOriginalUrls(urlString);
  };

  return {
    urls,
    setUrls,
    originalUrls,
    isEditing,
    startEditing,
    cancelEditing,
    resetForm,
    saveOriginalUrls,
  };
};
