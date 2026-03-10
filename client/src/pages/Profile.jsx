import React, { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const Profile = () => {

    const { user, setUser, axios, navigate } = useAppContext()

    const [name, setName] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [previewImage, setPreviewImage] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (user) {
            setName(user.name || '')
        }
    }, [user])

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setPreviewImage(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (currentPassword && !newPassword) {
            return toast.error('Please enter a new password')
        }
        if (!currentPassword && newPassword) {
            return toast.error('Please enter your current password')
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', name)
            if (currentPassword) formData.append('currentPassword', currentPassword)
            if (newPassword) formData.append('newPassword', newPassword)
            if (fileInputRef.current?.files[0]) {
                formData.append('profilePicture', fileInputRef.current.files[0])
            }

            const { data } = await axios.put('/api/user/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            if (data.success) {
                toast.success(data.message)
                setUser(data.user)
                setCurrentPassword('')
                setNewPassword('')
                setPreviewImage(null)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <div className='flex items-center justify-center h-[60vh]'>
                <p className='text-2xl font-medium text-primary'>Please login to view your profile.</p>
            </div>
        )
    }

    const avatarSrc = previewImage || user.profilePicture || null

    return (
        <div className='mt-16 pb-16 max-w-lg'>
            <div className='flex items-center gap-3 mb-8'>
                <button onClick={() => navigate(-1)} className='text-base text-gray-600 hover:text-primary transition cursor-pointer font-medium w-max' title='Go back'>
                    &lt; Back
                </button>
            </div>
            <div className='flex flex-col items-end w-max mb-8'>
                <p className='text-2xl font-medium'>MY PROFILE</p>
                <div className="w-16 h-0.5 bg-primary rounded-full"></div>
            </div>

            {/* Profile Picture & Info */}
            <div className='flex items-center gap-5 mb-8 p-5 bg-primary/5 rounded-lg border border-primary/20'>
                <div className='relative group'>
                    {avatarSrc ? (
                        <img src={avatarSrc} alt='Profile' className='w-20 h-20 rounded-full object-cover border-2 border-primary' />
                    ) : (
                        <div className='w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold'>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                    <button
                        type='button'
                        onClick={() => fileInputRef.current?.click()}
                        className='absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-sm cursor-pointer hover:bg-primary-dull transition shadow-md'
                        title='Change photo'
                    >
                        ✎
                    </button>
                    <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                        className='hidden'
                    />
                </div>
                <div>
                    <p className='text-lg font-semibold text-gray-800'>{user.name}</p>
                    <p className='text-sm text-gray-500'>{user.email}</p>
                </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className='space-y-5'>
                <div className='flex flex-col gap-1'>
                    <label className='text-base font-medium' htmlFor='profile-name'>Full Name</label>
                    <input
                        id='profile-name'
                        type='text'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='Enter your name'
                        className='outline-none py-2.5 px-3 rounded border border-gray-500/40 focus:border-primary transition'
                        required
                    />
                </div>

                {/* Email (Read-only) */}
                <div className='flex flex-col gap-1'>
                    <label className='text-base font-medium text-gray-400'>Email Address</label>
                    <input
                        type='email'
                        value={user.email}
                        disabled
                        className='outline-none py-2.5 px-3 rounded border border-gray-300/40 bg-gray-100 text-gray-500 cursor-not-allowed'
                    />
                </div>

                {/* Change Password Section */}
                <div className='border-t border-gray-300/50 pt-5 mt-5'>
                    <p className='text-base font-medium mb-3'>Change Password</p>
                    <div className='space-y-3'>
                        <div className='flex flex-col gap-1'>
                            <label className='text-sm text-gray-600' htmlFor='current-password'>Current Password</label>
                            <input
                                id='current-password'
                                type='password'
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder='Enter current password'
                                className='outline-none py-2.5 px-3 rounded border border-gray-500/40 focus:border-primary transition'
                            />
                        </div>
                        <div className='flex flex-col gap-1'>
                            <label className='text-sm text-gray-600' htmlFor='new-password'>New Password</label>
                            <input
                                id='new-password'
                                type='password'
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder='Enter new password (min 6 characters)'
                                className='outline-none py-2.5 px-3 rounded border border-gray-500/40 focus:border-primary transition'
                            />
                        </div>
                    </div>
                </div>

                <button
                    type='submit'
                    disabled={loading}
                    className='px-8 py-2.5 bg-primary hover:bg-primary-dull transition text-white font-medium rounded cursor-pointer disabled:opacity-50'
                >
                    {loading ? 'Updating...' : 'Update Profile'}
                </button>
            </form>
        </div>
    )
}

export default Profile
