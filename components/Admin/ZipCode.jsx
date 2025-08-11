import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "../ui/alert-dialog";

const ZipCode = () => {
    const [selectedState, setSelectedState] = useState('');
    const [districts, setDistricts] = useState([]);
    const [view, setView] = useState('states'); // 'states' or 'districts'

    const [districtStatus, setDistrictStatus] = useState({}); // { districtName: true/false }
    const [stateStatus, setStateStatus] = useState({});
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [charges, setCharges] = useState([{ amount: '', label: '' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [shippingCharges, setShippingCharges] = useState([]);
    const [editId, setEditId] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    // State/district data will now be fetched from the API
    const [stateDistrictData, setStateDistrictData] = useState([]);
    // console.log(stateDistrictData)

    // Toggle handlers
    const handleStateToggle = async (stateName) => {
        const newActive = !(stateStatus[stateName] !== false);
        try {
            const response = await fetch('/api/zipcode', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: stateName, active: newActive }),
            });
            const result = await response.json();
            if (result.success) {
                setStateStatus(prev => ({
                    ...prev,
                    [stateName]: newActive
                }));
                toast.success(`State '${stateName}' ${newActive ? 'activated' : 'deactivated'}`);
            } else {
                toast.error(result.error || 'Failed to update state status');
            }
        } catch (err) {
            toast.error('Failed to update state status');
        }
    };

    const handleDistrictToggle = async (districtName) => {
        const newActive = !(districtStatus[districtName] !== false);
        // Debug log for PATCH payload
        // console.log('PATCH district payload:', { state: selectedState, district: districtName, active: newActive });
        try {
            const response = await fetch('/api/zipcode', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: selectedState, district: districtName, active: newActive }),
            });
            const result = await response.json();
            if (result.success && result.data) {
                setDistrictStatus(prev => ({
                    ...prev,
                    [districtName]: newActive
                }));
                toast.success(`District '${districtName}' ${newActive ? 'activated' : 'deactivated'}`);
                // Force refresh of state/district data from DB
                fetchStateDistrictData();
            } else {
                toast.error(result.error || 'Failed to update district status');
                if (!result.data) {
                    toast.error('District not found in database. Check for exact name/case.');
                }
            }
        } catch (err) {
            toast.error('Failed to update district status');
        }
    };



    // Drilldown handlers
    const handleStateClick = (stateObj) => {
        setSelectedState(stateObj.state);
        // Deduplicate and sanitize districts
        const uniqueDistricts = Array.from(
            new Map((stateObj.districts || []).filter(d => d && d.district).map(d => [d.district, d])).values()
        );
        setDistricts(uniqueDistricts);
        // Initialize districtStatus from DB values
        if (uniqueDistricts.length > 0) {
            const newStatus = {};
            uniqueDistricts.forEach(d => {
                newStatus[d.district] = d.active !== false;
            });
            setDistrictStatus(newStatus);
        } else {
            setDistrictStatus({});
        }
        setView('districts');
    };
    const handleBack = () => {
        setView('states');
        setSelectedState('');
        setDistricts([]);
    };

    // Fetch state/district data from API on mount
    const fetchStateDistrictData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/zipcode');
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                setStateDistrictData(result.data);
                // Initialize stateStatus from DB values
                const stateStatusObj = {};
                result.data.forEach(s => {
                    stateStatusObj[s.state] = s.active !== false;
                });
                setStateStatus(stateStatusObj);
            } else {
                throw new Error(result.error || 'Failed to fetch state/district data');
            }
        } catch (error) {
            toast.error('Failed to fetch state/district data');
            setStateDistrictData([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchStateDistrictData();
    }, []);

    const [stateFilter, setStateFilter] = useState("");
    const [districtFilter, setDistrictFilter] = useState("");

    // Render filter inputs with labels and reset buttons
    const renderFilters = () => (
        <div className="flex gap-6 mb-4 items-end">
            <div className="flex flex-col">
                <label htmlFor="stateFilter" className="font-semibold mb-1">State Filter:</label>
                <div className="flex gap-2 items-center">
                    <input
                        id="stateFilter"
                        type="text"
                        value={stateFilter}
                        onChange={e => setStateFilter(e.target.value)}
                        className="border px-2 py-1 rounded"
                        placeholder="Search state..."
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={() => setStateFilter("")}
                        className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                        disabled={loading || !stateFilter}
                    >
                        Reset
                    </button>

                </div>
            </div>
            {view === 'districts' && (
                <div className="flex flex-col">
                    <label htmlFor="districtFilter" className="font-semibold mb-1">District Filter:</label>
                    <div className="flex gap-2">
                        <input
                            id="districtFilter"
                            type="text"
                            value={districtFilter}
                            onChange={e => setDistrictFilter(e.target.value)}
                            className="border px-2 py-1 rounded"
                            placeholder="Search district..."
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setDistrictFilter("")}
                            className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                            disabled={loading || !districtFilter}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderStatesTable = (filter) => {
        // Filter and deduplicate states by name
        const filteredStates = Array.from(
            new Map(
                stateDistrictData
                    .filter(stateObj => stateObj.state && stateObj.state.toLowerCase().includes((filter || '').toLowerCase()))
                    .map(obj => [obj.state, obj])
            ).values()
        );
        return (
            <div>
                <h2 className="text-2xl font-bold mb-2 text-center">States</h2>
                <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-blue-100">
                            <th className="border px-4 py-2 text-left">State</th>
                            <th className="border px-4 py-2 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={2} className="text-center py-6">
                                    <svg className="animate-spin h-6 w-6 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    <span className="block mt-2 text-blue-600 font-semibold">Loading data...</span>
                                </td>
                            </tr>
                        ) : filteredStates.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="text-center py-4 text-gray-500">No states found.</td>
                            </tr>
                        ) : (
                            filteredStates.map((stateObj) => (
                                <tr key={stateObj.state} className="bg-white">
                                    <td className="border px-4 py-2 font-semibold text-left">
                                        <button
                                            className="hover:underline text-blue-700 text-lg"
                                            onClick={() => handleStateClick(stateObj)}
                                        >
                                            {stateObj.state}
                                        </button>
                                    </td>
                                    <td className="border px-4 py-2 text-center">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <span className="mr-2 font-semibold">
                                                {stateStatus[stateObj.state] !== false ? "Active" : "Inactive"}
                                            </span>
                                            <span className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={stateStatus[stateObj.state] !== false}
                                                    onChange={() => handleStateToggle(stateObj.state)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:bg-blue-500 transition-all"></div>
                                                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform peer-checked:translate-x-5"></div>
                                            </span>
                                        </label>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderDistrictsTable = (filter) => {
        // Filter and deduplicate districts by name, trimming whitespace and ignoring case
        const cleanFilter = (filter || '').trim().toLowerCase();
        const filteredDistricts = Array.from(
            new Map(
                districts
                    .filter(districtObj => districtObj.district && districtObj.district.toLowerCase().includes(cleanFilter))
                    .map(obj => [obj.district, obj])
            ).values()
        );
        return (
            <div>
                <button
                    className="mb-4 bg-gray-400 hover:bg-gray-500 text-black font-semibold py-2 px-4 rounded"
                    onClick={handleBack}
                >
                    ← Back to States
                </button>
                <h2 className="text-2xl font-bold mb-2 text-center">Districts in {selectedState}</h2>

                <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-blue-100">
                            <th className="border px-4 py-2 text-left">District</th>
                            <th className="border px-4 py-2 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={2} className="text-center py-6">
                                    <svg className="animate-spin h-6 w-6 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    <span className="block mt-2 text-blue-600 font-semibold">Loading data...</span>
                                </td>
                            </tr>
                        ) : filteredDistricts.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="text-center py-4 text-gray-500">No districts found.</td>
                            </tr>
                        ) : (
                            filteredDistricts.map((districtObj) => (
                                <tr key={districtObj.district} className="bg-white">
                                    <td className="border px-4 py-2 text-left">{districtObj.district}</td>
                                    <td className="border px-4 py-2 text-center">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <span className="mr-2 font-semibold">
                                                {districtStatus[districtObj.district] !== false ? "Active" : "Inactive"}
                                            </span>
                                            <span className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={districtStatus[districtObj.district] !== false}
                                                    onChange={() => handleDistrictToggle(districtObj.district)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:bg-blue-500 transition-all"></div>
                                                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform peer-checked:translate-x-5"></div>
                                            </span>
                                        </label>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-white max-w-2xl min-h-[80vh] flex flex-col justify-start items-center">
            {error && (
                <div className="text-red-500 text-center mb-4">{error}</div>
            )}

            <h1 className="text-3xl font-bold mb-8 mt-6 text-center">ZipCode Management</h1>
            {/* Both filters always visible */}
            {renderFilters()}

            <div>
                {view === 'states' ? renderStatesTable(stateFilter) : renderDistrictsTable(districtFilter)}
            </div>
        </div>
    )
}

export default ZipCode;

