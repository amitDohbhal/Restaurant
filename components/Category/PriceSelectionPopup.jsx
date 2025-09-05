"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function PriceSelectionPopup({ product, onClose, onAddToCart }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  
  // Initialize price options with quantity 0 and selected false
  const priceOptions = [
    { id: 'full', label: 'Full', price: product.fullPrice },
    { id: 'half', label: 'Half', price: product.halfPrice },
    { id: 'quarter', label: 'Quarter', price: product.quarterPrice },
    { id: 'piece', label: 'Per Piece', price: product.perPiecePrice }
  ].filter(option => option.price);

  // Initialize selectedOptions state
  useEffect(() => {
    const initialOptions = {};
    priceOptions.forEach(option => {
      initialOptions[option.id] = {
        selected: false,
        quantity: 1,
        price: option.price
      };
    });
    setSelectedOptions(initialOptions);
  }, []);

  // Calculate total price
  const calculateTotal = () => {
    return Object.entries(selectedOptions).reduce((sum, [id, option]) => {
      if (option.selected) {
        return sum + (parseFloat(option.price) * option.quantity);
      }
      return sum;
    }, 0).toFixed(2);
  };

  const total = calculateTotal();

  const handleQuantityChange = (id, newQuantity) => {
    setSelectedOptions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        quantity: Math.max(1, newQuantity)
      }
    }));
  };

  const toggleOption = (id) => {
    setSelectedOptions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        selected: !prev[id].selected
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold">{product.title}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Select Portions</h4>
              <div className="space-y-3">
                {priceOptions.map((option) => (
                  <div 
                    key={option.id} 
                    className={`p-3 border rounded-lg ${selectedOptions[option.id]?.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedOptions[option.id]?.selected || false}
                          onChange={() => toggleOption(option.id)}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-md text-gray-600">
                            ₹{parseFloat(option.price).toFixed(2)} each
                          </div>
                        </div>
                      </div>
                      
                      {selectedOptions[option.id]?.selected && (
                        <div className="flex items-center space-x-2">
                          <span className="text-md text-gray-600">Qty:</span>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(option.id, (selectedOptions[option.id]?.quantity || 1) - 1);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="w-6 text-center">
                              {selectedOptions[option.id]?.quantity || 1}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(option.id, (selectedOptions[option.id]?.quantity || 0) + 1);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Total</span>
                <span className="text-xl font-bold">₹{total}</span>
              </div>
              <Button 
                onClick={() => {
                  // Create cart items for each selected option
                  const selectedItems = Object.entries(selectedOptions)
                    .filter(([_, option]) => option.selected)
                    .map(([id, option]) => ({
                      ...product,
                      selectedOption: id,
                      quantity: option.quantity,
                      price: parseFloat(option.price),
                      total: parseFloat(option.price) * option.quantity,
                      optionLabel: priceOptions.find(opt => opt.id === id)?.label || id
                    }));
                  
                  // Add each selected item to cart
                  selectedItems.forEach(item => {
                    onAddToCart(item);
                  });
                  
                  onClose();
                }}
                disabled={!Object.values(selectedOptions).some(opt => opt.selected)}
                className={`w-full h-12 ${!Object.values(selectedOptions).some(opt => opt.selected) ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {Object.values(selectedOptions).some(opt => opt.selected) 
                  ? `Add to Cart - ₹${total}`
                  : 'Select at least one option'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
