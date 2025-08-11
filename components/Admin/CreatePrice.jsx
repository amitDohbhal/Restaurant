"use client"
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "../ui/alert-dialog";

const CreatePrice = () => {
  // Default slabs for weight ranges
  const defaultSlabs = [
    { label: '0-1kg', amount: '' },
    { label: '1-5kg', amount: '' },
    { label: '5-15kg', amount: '' },
    { label: '15-100kg', amount: '' }
  ];
  const [charges, setCharges] = useState(defaultSlabs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);

  // Fetch shipping charges on mount and after save
  const fetchShippingCharges = async () => {
    try {
      const response = await fetch('/api/shippingCharges');
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].charges) {
        setCharges(
          defaultSlabs.map((slab, idx) => {
            const found = data[0].charges.find(c => c.label === slab.label);
            return { label: slab.label, amount: found ? found.shippingCharge.toString() : '' };
          })
        );
        setEditId(data[0]._id);
      } else {
        setCharges(defaultSlabs);
        setEditId(null);
      }
    } catch (error) {
      setError('Failed to fetch shipping charges');
    }
  };

  useEffect(() => {
    fetchShippingCharges();
  }, []);

  // Only allow editing the amount, not the label
  const handleChargeAmountChange = (idx, value) => {
    setCharges(charges.map((row, i) => i === idx ? { ...row, amount: value } : row));
  };

  // Save shipping charges to API
  const saveShippingCharges = async () => {
    if (charges.some(c => !c.amount)) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        charges: charges.map((c, i) => ({ label: defaultSlabs[i].label, shippingCharge: Number(c.amount) || 0 }))
      };
      const response = await fetch('/api/shippingCharges', {
        method: editId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editId ? { ...payload, _id: editId } : payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save shipping charges');
      }

      toast.success(editId ? 'Shipping charges updated successfully!' : 'Shipping charges saved successfully!');
      // Always reload the latest data after save
      await fetchShippingCharges();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white min-h-[80vh] flex flex-col justify-center items-center">
      {error && (
        <div className="text-red-500 text-center mb-4">{error}</div>
      )}
      <label className="font-bold text-lg col-span-1">Shipping Charges</label>
      <div className="grid grid-cols-2 gap-4 items-start mb-4 w-full justify-center items-center">
        <div className="col-span-2 w-full">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-blue-200 text-black font-bold text-lg text-center py-2 rounded">Weight Slab</div>
            <div className="bg-blue-200 text-black font-bold text-lg text-center py-2 rounded">Amount</div>
          </div>
          {charges.map((row, idx) => (
            <div className="grid grid-cols-2 gap-2 mb-2 items-center" key={idx}>
              <input
                type="text"
                className="bg-blue-100 text-black font-normal text-lg px-4 py-2 rounded placeholder-black focus:outline-none"
                value={row.label}
                disabled
                readOnly
              />
              <input
                type="number"
                className="bg-blue-200 text-black font-normal text-lg px-4 py-2 rounded placeholder-black focus:outline-none"
                placeholder="Enter Amount"
                value={row.amount}
                onChange={e => handleChargeAmountChange(idx, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <button
          className="bg-red-500 text-black font-bold text-lg px-16 py-3 rounded hover:bg-blue-800"
          onClick={saveShippingCharges}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Data'}
        </button>
      </div>
    </div>
  )
}

export default CreatePrice;

