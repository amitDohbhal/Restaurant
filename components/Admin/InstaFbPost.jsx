"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
// import { UploadButton } from "@/utils/cloudinary"; // Removed UploadThing
import { PencilIcon, Trash2Icon } from "lucide-react";

const InstaFbPost = () => {
    const [posts, setPosts] = useState([]);
    const [editPost, setEditPost] = useState(null);
    const [postFormData, setPostFormData] = useState({
        image: { url: "", key: "" },
        link: "",
        type: "instagram",
    });
    const [isUploading, setIsUploading] = useState(false);

    // --- Facebook Post State ---
    const [fbFormData, setFbFormData] = useState({
        image: { url: "", key: "" },
        link: "",
        type: "facebook",
    });
    const [isFbUploading, setIsFbUploading] = useState(false);

    // --- Post Filter State (default Instagram) ---
    const [activeTab, setActiveTab] = useState("instagram"); // instagram | facebook

    // --- API URLs for each type ---
    const instaUrl = "/api/instagram-posts";
    const fbUrl = "/api/facebook-posts";

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const url = activeTab === "instagram" ? instaUrl : fbUrl;
                const response = await fetch(url);
                const data = await response.json();
                setPosts(data);
            } catch (error) {
                toast.error("Failed to fetch Post posts");
            }
        };
        fetchPosts();
    }, [activeTab]);

    const handlePostInputChange = (e) => {
        setPostFormData({ ...postFormData, [e.target.name]: e.target.value });
    };

    const handlePostImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/cloudinary', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Image upload failed');
            const result = await res.json();
            setPostFormData({ ...postFormData, image: { url: result.url, key: result.key } });
            toast.success('Image uploaded successfully!');
        } catch (err) {
            toast.error('Image upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!postFormData.image.url) return toast.error("Please upload an image");
        if (!postFormData.link) return toast.error("Please enter a url");
        try {
            const method = editPost ? "PATCH" : "POST";
            const url = activeTab === "instagram" ? instaUrl : fbUrl;
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: postFormData.image.url,
                    url: postFormData.link,
                    id: editPost,
                    type: activeTab,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`${activeTab} post ${editPost ? "updated" : "added"} successfully`);
                setEditPost(null);
                // Refresh posts
                const updatedPosts = await fetch(activeTab === "instagram" ? instaUrl : fbUrl).then((res) => res.json());
                setPosts(updatedPosts);
                setPostFormData({ image: { url: "", key: "" }, link: "" });
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    // --- Facebook Handlers ---
    const handleFbInputChange = (e) => {
        setFbFormData({ ...fbFormData, [e.target.name]: e.target.value });
    };
    const handleFbImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsFbUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/cloudinary', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Image upload failed');
            const result = await res.json();
            setFbFormData({ ...fbFormData, image: { url: result.url, key: result.key } });
            toast.success('Image uploaded successfully!');
        } catch (err) {
            toast.error('Image upload failed');
        } finally {
            setIsFbUploading(false);
        }
    };
    const handleFbSubmit = async (e) => {
        e.preventDefault();
        if (!fbFormData.image.url) return toast.error("Please upload an image");
        if (!fbFormData.link) return toast.error("Please enter a url");
        try {
            const method = editPost ? "PATCH" : "POST";
            const url = fbUrl;
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: fbFormData.image.url,
                    url: fbFormData.link,
                    id: editPost,
                    type: "facebook",
                }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`Facebook post ${editPost ? "updated" : "added"} successfully`);
                setEditPost(null);
                // Refresh posts
                const updatedPosts = await fetch(fbUrl).then((res) => res.json());
                setPosts(updatedPosts);
                setFbFormData({ image: { url: "", key: "" }, link: "" });
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handlePostEdit = (post) => {
        setEditPost(post._id);
        if (post.type === "facebook") {
            setActiveTab("facebook");
            setFbFormData({
                image: { url: post.image, key: post.imageKey || "" },
                link: post.url || "",
            });
        } else {
            setActiveTab("instagram");
            setPostFormData({
                image: { url: post.image, key: post.imageKey || "" },
                link: post.url || "",
            });
        }
    };

    const handlePostDelete = async (id) => {
        try {
            // Get the post type from the filtered posts
            const post = posts.find(post => post._id === id);
            const url = post.type === "facebook" ? fbUrl : instaUrl;
            
            const response = await fetch(`${url}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("Post deleted successfully");
                setPosts((prev) => prev.filter((post) => post._id !== id));
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handlePostDeleteImage = async (key) => {
        setPostFormData({ ...postFormData, image: { url: "", key: "" } });
    };

    // --- Filtered Posts ---
    // Compare by type field
    const filteredPosts = posts.filter(post => post.type === activeTab);

    return (
        <div className="max-w-2xl mx-auto py-10 w-full">
            <div className="flex gap-2 mb-8">
                <button
                    className={`px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors duration-150 ${activeTab === "instagram" ? "bg-pink-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-pink-100"}`}
                    onClick={() => { setActiveTab("instagram"); setEditPost(null); }}
                >
                    Instagram Posts
                </button>
                <button
                    className={`px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors duration-150 ${activeTab === "facebook" ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-800 hover:bg-blue-100"}`}
                    onClick={() => { setActiveTab("facebook"); setEditPost(null); }}
                >
                    Facebook Posts
                </button>
            </div>

            {/* Instagram Section */}
            {activeTab === "instagram" && (
                <>
                    <h2 className="text-2xl font-bold mb-6">{editPost ? "Edit Instagram Post" : "Add New Instagram Post"}</h2>
                    <form onSubmit={handlePostSubmit} className="space-y-4 mb-8">
                        <div>
                            <label className="block font-medium mb-1">Upload Instagram Image</label>
                            {postFormData.image.url ? (
                                <div className="relative inline-block">
                                    <Image src={postFormData.image.url} alt="Instagram Preview" width={200} height={200} className="rounded shadow" />
                                    <button type="button" onClick={() => setPostFormData({ ...postFormData, image: { url: "", key: "" } })} className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded">Remove</button>
                                </div>
                            ) : (
                                <div>
                                    {isUploading && <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded shadow mb-2">Uploading...</div>}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="insta-image-upload-input"
                                        onChange={handlePostImageUpload}
                                        disabled={isUploading}
                                    />
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
                                        onClick={() => document.getElementById('insta-image-upload-input').click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? 'Uploading...' : 'Upload Image'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Instagram URL</label>
                            <input
                                name="link"
                                type="url"
                                value={postFormData.link || ""}
                                onChange={handlePostInputChange}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded">
                                {editPost ? "Update Instagram Post" : "Add Instagram Post"}
                            </button>
                            {editPost && (
                                <button
                                    type="button"
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded border border-gray-400"
                                    onClick={() => {
                                        setEditPost(null);
                                        setPostFormData({ image: { url: "", key: "" }, link: "", type: "instagram" });
                                    }}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>

                    <h2 className="text-lg font-bold mb-4">Existing Instagram Posts</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredPosts.length > 0 ? (
                            filteredPosts.map((post, idx) => (
                                <div key={post._id} className="bg-white rounded shadow p-4 flex flex-col items-center">
                                    <div className="w-[150px] h-[150px] mb-2 flex items-center justify-center overflow-hidden rounded bg-gray-50">
                                        <Image
                                            src={post.image}
                                            alt={`Instagram ${idx}`}
                                            width={150}
                                            height={150}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all mb-2">{post.url}</a>
                                    <div className="flex flex-row gap-2 mt-2">
                                        <span className="text-xs px-2 py-0.5 rounded-full mb-1 bg-pink-100 text-pink-700">Instagram</span>
                                        <button onClick={() => handlePostEdit(post)} className="bg-gray-200 px-2 py-1 rounded flex items-center justify-center"><PencilIcon size={16} /></button>
                                        <button onClick={() => handlePostDelete(post._id)} className="bg-red-600 text-white px-2 py-1 rounded flex items-center justify-center"><Trash2Icon size={16} /></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-500">No Instagram posts found</div>
                        )}
                    </div>
                </>
            )}

            {/* Facebook Section */}
            {activeTab === "facebook" && (
                <>
                    <h2 className="text-2xl font-bold mb-6">{editPost ? "Edit Facebook Post" : "Add New Facebook Post"}</h2>
                    <form onSubmit={handleFbSubmit} className="space-y-4 mb-8">
                        <div>
                            <label className="block font-medium mb-1">Upload Facebook Image</label>
                            {fbFormData.image.url ? (
                                <div className="relative inline-block">
                                    <Image src={fbFormData.image.url} alt="Facebook Preview" width={200} height={200} className="rounded shadow" />
                                    <button type="button" onClick={() => setFbFormData({ ...fbFormData, image: { url: "", key: "" } })} className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded">Remove</button>
                                </div>
                            ) : (
                                <div>
                                    {isFbUploading && <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded shadow mb-2">Uploading...</div>}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="fb-image-upload-input"
                                        onChange={handleFbImageUpload}
                                        disabled={isFbUploading}
                                    />
                                    <button
                                        type="button"
                                        className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
                                        onClick={() => document.getElementById('fb-image-upload-input').click()}
                                        disabled={isFbUploading}
                                    >
                                        {isFbUploading ? 'Uploading...' : 'Upload Image'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Facebook URL</label>
                            <input
                                name="link"
                                type="url"
                                value={fbFormData.url}
                                onChange={handleFbInputChange}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded">
                                {editPost ? "Update Facebook Post" : "Add Facebook Post"}
                            </button>
                            {editPost && (
                                <button
                                    type="button"
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded border border-gray-400"
                                    onClick={() => {
                                        setEditPost(null);
                                        setFbFormData({ image: { url: "", key: "" }, link: "", type: "facebook" });
                                    }}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>

                    <h2 className="text-lg font-bold mb-4">Existing Facebook Posts</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredPosts.length > 0 ? (
                            filteredPosts.map((post, idx) => (
                                <div key={post._id} className="bg-white rounded shadow p-4 flex flex-col items-center">
                                    <div className="w-[150px] h-[150px] mb-2 flex items-center justify-center overflow-hidden rounded bg-gray-50">
                                        <Image
                                            src={post.image}
                                            alt={`Facebook ${idx}`}
                                            width={150}
                                            height={150}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all mb-2">{post.url}</a>
                                    <div className="flex flex-row gap-2 mt-2">
                                        <span className="text-xs px-2 py-0.5 rounded-full mb-1 bg-blue-100 text-blue-700">Facebook</span>
                                        <button onClick={() => handlePostEdit(post)} className="bg-gray-200 px-2 py-1 rounded flex items-center justify-center"><PencilIcon size={16} /></button>
                                        <button onClick={() => handlePostDelete(post._id)} className="bg-red-600 text-white px-2 py-1 rounded flex items-center justify-center"><Trash2Icon size={16} /></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-500">No Facebook posts found</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default InstaFbPost;
