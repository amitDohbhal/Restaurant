
const PackageMap = ({ location }) => {
  return (
    <div className="h-[500px] bg-gray-200 rounded-lg overflow-hidden">
      <iframe
        src={location}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  )
}

export default PackageMap