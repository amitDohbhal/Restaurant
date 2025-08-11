// Simple, always-visible important notice box

export default function ImportantNotice() {
  return (
    <div className="bg-red-100 text-red-700 border-l-4 border-red-500 m-4 p-4 rounded-md shadow-md">
      <span className="font-semibold">Availability Notice :- </span>
      <span className="font-medium">*No booking hold , rates are tentative as the matter of subject of availability *</span>
    </div>
  );
}
