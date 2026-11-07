// src/app/(admin)/admin/products/[id]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft, FiSave, FiPlus, FiTrash2, FiImage,
  FiCheckCircle, FiCheckSquare, FiCircle
} from "react-icons/fi";
import Link from "next/link";
import { getProductById, updateProduct, getCategoriesForFilter, createQuickCategory } from "@/actions/product";

// Định nghĩa Type (Reuse từ create page)
interface OptionItem {
  id: string;
  name: string;
  price: number;
}
interface OptionGroup {
  id: string;
  title: string;
  isRequired: boolean;
  type: "single" | "multiple";
  items: OptionItem[];
}
interface Category {
  id: number;
  name: string;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  // Unrap params (NextJS 15)
  const resolvedParams = use(params);
  const productId = Number(resolvedParams.id);

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  // State cho Quick Category Create
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // 1. Fetch dữ liệu ban đầu
  useEffect(() => {
    const initData = async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          getProductById(productId),
          getCategoriesForFilter(),
        ]);

        setCategories(categoryData);

        if (productData) {
          setProductName(productData.name);
          setPrice(productData.basePrice);
          setCategoryId(productData.categoryId);
          setDescription(productData.description);
          setImageUrl(productData.imageUrl);
          setIsAvailable(productData.isAvailable ?? true);
          // Map optionGroups từ DB về format của UI
          const mappedOptions: OptionGroup[] = productData.optionGroups.map((g, idx) => ({
            id: `group-${idx}-${Date.now()}`, // Tạo ID tạm cho UI
            title: g.name,
            isRequired: g.isRequired,
            type: g.isMultiple ? "multiple" : "single",
            items: g.optionValues.map((v, vIdx) => ({
              id: `item-${vIdx}-${Date.now()}`,
              name: v.name,
              price: v.priceAdjustment,
            })),
          }));
          setOptionGroups(mappedOptions);
        } else {
            alert("Không tìm thấy sản phẩm!");
            router.push("/admin/products");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, [productId, router]);

  // 2. Xử lý tạo danh mục nhanh
  const handleQuickCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const res = await createQuickCategory(newCatName);
    if (res.success && res.data) {
        setCategories([...categories, res.data]);
        setCategoryId(res.data.id); // Auto select danh mục mới
        setNewCatName("");
        setIsCreatingCat(false);
    } else {
        alert("Lỗi tạo danh mục");
    }
  };

  // 3. Xử lý Save (Update)
  const handleSave = async () => {
    if (!productName || !price || !categoryId) {
      alert("Vui lòng điền đủ thông tin bắt buộc!");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: productName,
        basePrice: price,
        categoryId: categoryId,
        description: description,
        imageUrl: imageUrl,
        isAvailable: isAvailable,
        optionGroups: optionGroups.map((g) => ({
          title: g.title,
          isRequired: g.isRequired,
          type: g.type,
          items: g.items.map((i) => ({ name: i.name, price: i.price })),
        })),
      };

      const result = await updateProduct(productId, payload);
      if (result.success) {
        alert("Cập nhật thành công!");
        router.push("/admin/products");
      } else {
        alert("Lỗi: " + result.error);
      }
    } catch (e) {
      console.error(e);
      alert("Đã có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Các hàm helper cho Option (Giống hệt trang Create - có thể tách hook nhưng để chung cho dễ copy)
  const addOptionGroup = () => {
    setOptionGroups([...optionGroups, {
      id: `group-${Date.now()}`, title: "Nhóm mới", isRequired: false, type: "single",
      items: [{ id: `item-${Date.now()}`, name: "Lựa chọn 1", price: 0 }]
    }]);
  };
  const removeOptionGroup = (id: string) => setOptionGroups(optionGroups.filter(g => g.id !== id));
  const updateOptionGroup = (id: string, field: keyof OptionGroup, value: any) => {
    setOptionGroups(optionGroups.map(g => g.id === id ? { ...g, [field]: value } : g));
  };
  const addOptionItem = (gId: string) => {
    setOptionGroups(optionGroups.map(g => g.id === gId ? {
      ...g, items: [...g.items, { id: `item-${Date.now()}`, name: "", price: 0 }]
    } : g));
  };
  const updateOptionItem = (gId: string, iId: string, field: keyof OptionItem, value: any) => {
    setOptionGroups(optionGroups.map(g => g.id === gId ? {
      ...g, items: g.items.map(i => i.id === iId ? { ...i, [field]: value } : i)
    } : g));
  };
  const removeOptionItem = (gId: string, iId: string) => {
    setOptionGroups(optionGroups.map(g => g.id === gId ? {
      ...g, items: g.items.filter(i => i.id !== iId)
    } : g));
  };

  if (isLoading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1d150b]">Chỉnh sửa món</h1>
            <p className="text-sm text-gray-500">ID: #{productId}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/products" className="px-5 py-2.5 border rounded-xl text-gray-600 hover:bg-gray-50">Hủy</Link>
          <button onClick={handleSave} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 bg-[#c49b63] hover:bg-[#b08b55] text-white rounded-xl shadow-lg shadow-[#c49b63]/30">
            <FiSave size={20} /> <span>{isSubmitting ? "Đang lưu..." : "Cập nhật"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Info Basic */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#1d150b] mb-4">Thông tin cơ bản</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên món <span className="text-red-500">*</span></label>
                <input type="text" value={productName} onChange={e => setProductName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#c49b63] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán <span className="text-red-500">*</span></label>
                  <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#c49b63] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục <span className="text-red-500">*</span></label>
                  {!isCreatingCat ? (
                      <div className="flex gap-2">
                        <select 
                            value={categoryId || ""} 
                            onChange={e => setCategoryId(Number(e.target.value))} 
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#c49b63] outline-none"
                        >
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button 
                            onClick={() => setIsCreatingCat(true)}
                            className="px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-[#c49b63]" title="Thêm danh mục nhanh"
                        >
                            <FiPlus size={20}/>
                        </button>
                      </div>
                  ) : (
                      <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                          <input 
                            type="text" 
                            placeholder="Tên danh mục mới..." 
                            value={newCatName}
                            autoFocus
                            onChange={e => setNewCatName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-[#c49b63] rounded-xl outline-none ring-1 ring-[#c49b63]/50"
                          />
                          <button onClick={handleQuickCreateCategory} className="px-3 bg-[#c49b63] text-white rounded-xl whitespace-nowrap">Lưu</button>
                          <button onClick={() => setIsCreatingCat(false)} className="px-3 bg-gray-100 text-gray-500 rounded-xl">Hủy</button>
                      </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#c49b63] outline-none" />
              </div>
            </div>
          </div>

          {/* Option Groups (Copy layout from Create Page) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-6">
              <h3 className="text-lg font-bold">Tùy chọn & Topping</h3>
              <button onClick={addOptionGroup} className="text-[#c49b63] flex items-center gap-1 font-medium"><FiPlus /> Thêm nhóm</button>
            </div>
            <div className="space-y-6">
              {optionGroups.map(group => (
                <div key={group.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50/30 hover:border-[#c49b63] transition-colors">
                  {/* Group Header */}
                  <div className="flex justify-between gap-4 mb-4">
                     <div className="flex-1 space-y-3">
                        <input 
                            value={group.title} 
                            onChange={e => updateOptionGroup(group.id, 'title', e.target.value)}
                            className="font-bold bg-transparent border-b border-dashed border-gray-300 focus:border-[#c49b63] outline-none w-full"
                            placeholder="Tên nhóm (VD: Size)"
                        />
                        <div className="flex gap-4 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={group.type === 'single'} onChange={() => updateOptionGroup(group.id, 'type', 'single')} className="hidden" />
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${group.type === 'single' ? 'border-[#c49b63] bg-[#c49b63]' : 'border-gray-400'}`}>
                                    {group.type === 'single' && <FiCheckCircle className="text-white text-[10px]" />}
                                </span>
                                <span>Chọn 1</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={group.type === 'multiple'} onChange={() => updateOptionGroup(group.id, 'type', 'multiple')} className="hidden" />
                                <span className={`w-4 h-4 rounded border flex items-center justify-center ${group.type === 'multiple' ? 'border-[#c49b63] bg-[#c49b63]' : 'border-gray-400'}`}>
                                    {group.type === 'multiple' && <FiCheckSquare className="text-white text-[10px]" />}
                                </span>
                                <span>Chọn nhiều</span>
                            </label>
                            <label className="flex items-center gap-2 ml-4">
                                <input type="checkbox" checked={group.isRequired} onChange={e => updateOptionGroup(group.id, 'isRequired', e.target.checked)} className="text-[#c49b63] focus:ring-[#c49b63]" />
                                <span>Bắt buộc</span>
                            </label>
                        </div>
                     </div>
                     <button onClick={() => removeOptionGroup(group.id)} className="text-gray-400 hover:text-red-500"><FiTrash2 size={18} /></button>
                  </div>
                  {/* Items */}
                  <div className="pl-4 border-l-2 space-y-2">
                    {group.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                            <div className="text-gray-400">{group.type === 'single' ? <FiCircle size={14}/> : <FiCheckSquare size={14}/>}</div>
                            <input value={item.name} onChange={e => updateOptionItem(group.id, item.id, 'name', e.target.value)} className="flex-1 px-3 py-1.5 bg-white border rounded-lg text-sm focus:border-[#c49b63] outline-none" placeholder="Tên tùy chọn" />
                            <input type="number" value={item.price} onChange={e => updateOptionItem(group.id, item.id, 'price', Number(e.target.value))} className="w-24 px-3 py-1.5 bg-white border rounded-lg text-sm text-right focus:border-[#c49b63] outline-none" />
                            <button onClick={() => removeOptionItem(group.id, item.id)} className="text-gray-300 hover:text-red-500"><FiTrash2 size={16}/></button>
                        </div>
                    ))}
                    <button onClick={() => addOptionItem(group.id)} className="text-xs font-medium text-[#c49b63] mt-2">+ Thêm lựa chọn</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Image) */}
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4">Hình ảnh</h3>
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full mb-4 px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none focus:border-[#c49b63]" placeholder="URL ảnh..." />
                <div className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                    {imageUrl ? <img src={imageUrl} alt="Preview" className="w-full h-full object-cover"/> : <div className="text-gray-400 text-center"><FiImage size={30} className="mx-auto mb-2"/><span>Chưa có ảnh</span></div>}
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#1d150b] mb-4">Trạng thái món</h3>
                
                <label className="flex items-center justify-between cursor-pointer group p-3 rounded-xl border border-transparent hover:bg-gray-50 transition-all">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">
                            {isAvailable ? "Đang bán (Active)" : "Ngừng bán (Hidden)"}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">
                            {isAvailable 
                                ? "Sản phẩm sẽ hiển thị trên menu" 
                                : "Khách hàng sẽ không thấy món này"}
                        </span>
                    </div>
                    
                    <div className="relative inline-block w-12 h-7 transition duration-200 ease-in-out">
                        <input 
                            type="checkbox" 
                            className="peer absolute w-full h-full opacity-0 cursor-pointer" 
                            checked={isAvailable}
                            onChange={(e) => setIsAvailable(e.target.checked)}
                        />
                        <span className={`block w-full h-full rounded-full shadow-inner transition-colors duration-300 ${isAvailable ? 'bg-[#c49b63]' : 'bg-gray-200'}`}></span>
                        <span className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${isAvailable ? 'translate-x-5' : ''}`}></span>
                    </div>
                </label>

                {/* Badge hiển thị nhanh */}
                <div className={`mt-4 py-2 px-3 rounded-lg text-center text-sm font-medium border ${
                    isAvailable 
                    ? "bg-green-50 text-green-700 border-green-100" 
                    : "bg-red-50 text-red-700 border-red-100"
                }`}>
                    {isAvailable ? "● Đang hiển thị" : "● Đang ẩn"}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}