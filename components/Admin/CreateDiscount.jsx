"use client";
import React, { useEffect, useState } from "react";
import { Switch } from "../ui/switch";
import toast, { Toaster } from "react-hot-toast";

const initialForm = {
  couponCode: "",
  amount: "",
  percent: "",
  startDate: "",
  endDate: "",
  category: "",
};

const CreateDiscount = () => {

  const [form, setForm] = useState(initialForm);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discountCoupon");
      const data = await res.json();
      setDiscounts(Array.isArray(data) ? data : []);
    } catch (err) {
      alert("Failed to fetch discounts");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountPercent = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      setForm((prev) => ({ ...prev, amount: value, percent: "" }));
    } else {
      setForm((prev) => ({ ...prev, percent: value, amount: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.couponCode || (!form.amount && !form.percent) || !form.startDate || !form.endDate) {
      toast.error("Fill all required fields");
      return;
    }
    setLoading(true);
    try {
      let res, data;
      if (editId) {
        res = await fetch("/api/discountCoupon", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            couponCode: form.couponCode,
            amount: form.amount ? Number(form.amount) : undefined,
            percent: form.percent ? Number(form.percent) : undefined,
            startDate: form.startDate,
            endDate: form.endDate,
            // category: form.category,
            edit: true
          }),
        });
        data = await res.json();
      } else {
        res = await fetch("/api/discountCoupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponCode: form.couponCode,
            amount: form.amount ? Number(form.amount) : undefined,
            percent: form.percent ? Number(form.percent) : undefined,
            startDate: form.startDate,
            endDate: form.endDate,
            // category: form.category,
          }),
        });
        data = await res.json();
      }
      if (res.ok) {
        setForm(initialForm);
        setEditId(null);
        fetchDiscounts();
        toast.success(editId ? "Discount updated!" : "Discount added!");
      } else {
        toast.error(data.error || "Failed to save discount");
      }
    } catch (err) {
      toast.error("Error saving discount");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setUpdating(true);
    try {
      if (action === "delete") {
        await fetch("/api/discountCoupon", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        toast.success("Discount deleted!");
      } else {
        await fetch("/api/discountCoupon", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: action }),
        });
        toast.success(action === "active" ? "Activated!" : "Paused!");
      }
      fetchDiscounts();
    } catch (err) {
      toast.error("Error updating discount");
    } finally {
      setUpdating(false);
    }
  };

  const handleSwitch = async (id, checked) => {
    await handleAction(id, checked ? "active" : "paused");
  };

  const handleEdit = (discount) => {
    setEditId(discount._id);
    setForm({
      couponCode: discount.couponCode,
      amount: discount.amount ? String(discount.amount) : "",
      percent: discount.percent ? String(discount.percent) : "",
      startDate: discount.startDate ? discount.startDate.slice(0, 10) : "",
      endDate: discount.endDate ? discount.endDate.slice(0, 10) : "",
      category: discount.category || "",
    });
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 12, maxWidth: 900, margin: "40px auto" }}>
      <Toaster position="top-center" />
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}> 
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 500 }}>Create Discount Coupon Code</label>
            <input name="couponCode" value={form.couponCode} onChange={handleChange} placeholder="Coupon Code" style={inputStyle} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 500 }}>Amount</label>
            <input type="number" name="amount" value={form.amount} onChange={handleAmountPercent} placeholder="Amount" style={inputStyle} disabled={!!form.percent} />
          </div>
          <div style={{ alignSelf: "center", fontWeight: 500 }}>Or</div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 500 }}>%</label>
            <input type="number" name="percent" value={form.percent} onChange={handleAmountPercent} placeholder="% Value" style={inputStyle} disabled={!!form.amount} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 500 }}>Coupon Code Start Date</label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={inputStyle} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 500 }}>Coupon Code End Date</label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} style={inputStyle} required />
          </div>
        </div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          {editId ? (
            <>
              <button type="submit" style={buttonStyle} disabled={loading}>{loading ? "Updating..." : "Update"}</button>
              <button type="button" style={{...buttonStyle, background: '#888'}} onClick={() => { setForm(initialForm); setEditId(null); }}>Cancel Edit</button>
            </>
          ) : (
            <button type="submit" style={buttonStyle} disabled={loading}>{loading ? "Adding..." : "Add Data"}</button>
          )}
        </div>
      </form>
      <div style={{ marginBottom: 12, fontWeight: 500 }}>
         View all active, upcoming, and expired discounts.
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fafafa" }}>
          <thead>
            <tr style={{ background: "#eee" }}>
              <th style={thStyle}>S.No.</th>
              <th style={thStyle}>Coupon Code</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>% Value</th>
              <th style={thStyle}>Date Range</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {discounts.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center" }}>No discounts found.</td></tr>
            )}
            {discounts.map((d, idx) => (
              <tr key={d._id}>
                <td style={tdStyle}>{idx + 1}</td>
                <td style={tdStyle}>{d.couponCode}</td>
                <td style={tdStyle}>{d.amount || "-"}</td>
                <td style={tdStyle}>{d.percent || "-"}</td>
                <td style={tdStyle}>{d.startDate?.slice(0, 10)} to {d.endDate?.slice(0, 10)}</td>
                <td style={tdStyle}>{d.status}</td>
                <td style={tdStyle}>
                  <Switch
                    checked={d.status === "active"}
                    onCheckedChange={(checked) => handleSwitch(d._id, checked)}
                    disabled={updating}
                  />
                  <button style={actionBtnStyle("edit")}
                    onClick={() => handleEdit(d)} disabled={updating}>Edit</button>
                  <button style={actionBtnStyle("delete")}
                    onClick={() => handleAction(d._id, "delete")} disabled={updating}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 20,
  border: "1px solid #bbb",
  background: "#eee",
  fontSize: 16,
  marginTop: 4,
  marginBottom: 4,
};
const buttonStyle = {
  background: "#000",
  color: "#fff",
  padding: "12px 32px",
  border: "none",
  borderRadius: 20,
  fontWeight: 600,
  fontSize: 16,
  cursor: "pointer",
  marginRight: 8,
};
const thStyle = {
  padding: 8,
  fontWeight: 600,
  border: "1px solid #ccc",
  background: "#f5f5f5",
};
const tdStyle = {
  padding: 8,
  border: "1px solid #eee",
  textAlign: "center",
};
const actionBtnStyle = (type) => ({
  background: type === "delete" ? "#ff9800" : type === "active" ? "#43a047" : "#e53935",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 12px",
  margin: "0 2px",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
});

export default CreateDiscount;