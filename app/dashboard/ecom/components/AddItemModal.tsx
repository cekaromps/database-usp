"use client";
import { useState } from "react";
import { EcomItem } from "../EcomManager";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: EcomItem) => void;
}

// TODO: CONTINUE
export default function AddItemModal({
  isOpen,
  onClose,
  onAdd,
}: AddItemModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    quantity: 0,
    sku: "",
  });

  if (!isOpen) return null;
  const handleSubmit;
}
