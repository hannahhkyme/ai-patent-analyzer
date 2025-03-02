import { useState } from "react";

const UploadPatent = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log(data);
  };

  return (
    <div>
      <input type="file" accept=".pdf" onChange={handleFileUpload} />
      <button onClick={handleSubmit}>Analyze</button>
    </div>
  );
};

export default UploadPatent;