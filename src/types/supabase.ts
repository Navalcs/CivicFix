export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    email: string
                    id: string
                    name: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    email: string
                    id: string
                    name?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    email?: string
                    id?: string
                    name?: string | null
                }
            }
            reports: {
                Row: {
                    category: string
                    created_at: string
                    description: string | null
                    id: string
                    image_url: string | null
                    latitude: number | null
                    local_image_uri: string | null
                    longitude: number | null
                    status: 'Pending' | 'In Progress' | 'Resolved'
                    user_id: string
                }
                Insert: {
                    category: string
                    created_at?: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    latitude?: number | null
                    local_image_uri?: string | null
                    longitude?: number | null
                    status?: 'Pending' | 'In Progress' | 'Resolved'
                    user_id: string
                }
                Update: {
                    category?: string
                    created_at?: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    latitude?: number | null
                    local_image_uri?: string | null
                    longitude?: number | null
                    status?: 'Pending' | 'In Progress' | 'Resolved'
                    user_id?: string
                }
            }
        }
    }
}
