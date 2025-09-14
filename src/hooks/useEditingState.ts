import { useState } from "react";
import { useAthletes } from "@/lib/store/athleteStore";

export const useEditingState = (initialUrls: string[] = []) => {
  const athletes = useAthletes(); // Get current athletes from store
  const [urls, setUrls] = useState<string>(initialUrls.join("\n"));
  const [originalUrls, setOriginalUrls] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = () => {
    // Populate with current athletes' original URLs
    const currentUrls = athletes
      .filter(athlete => athlete.originalUrl) // Only include athletes with original URLs
      .map(athlete => athlete.originalUrl!)
      .join("\n");
    
    setUrls(currentUrls);
    setOriginalUrls(currentUrls);
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

  const completeEditing = () => {
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
    completeEditing,
    saveOriginalUrls,
  };
};
