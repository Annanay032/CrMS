import { api } from '../api';
import type { ApiResponse, MediaFolder, MediaAsset } from '@/types';

interface PaginatedAssets {
  items: MediaAsset[];
  total: number;
  page: number;
  limit: number;
}

export const mediaApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMediaFolders: build.query<ApiResponse<MediaFolder[]>, { parentId?: string } | void>({
      query: (params) => ({ url: '/media/folders', params: params ?? {} }),
      providesTags: ['Media'],
    }),

    createMediaFolder: build.mutation<ApiResponse<MediaFolder>, { name: string; parentId?: string }>({
      query: (body) => ({ url: '/media/folders', method: 'POST', body }),
      invalidatesTags: ['Media'],
    }),

    deleteMediaFolder: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/media/folders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Media'],
    }),

    getMediaAssets: build.query<ApiResponse<PaginatedAssets>, { folderId?: string; tag?: string; search?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: '/media/assets', params }),
      providesTags: ['Media'],
    }),

    uploadMediaAsset: build.mutation<ApiResponse<MediaAsset>, FormData>({
      query: (body) => ({ url: '/media/assets', method: 'POST', body }),
      invalidatesTags: ['Media'],
    }),

    updateMediaAsset: build.mutation<ApiResponse<void>, { id: string; data: { tags?: string[]; folderId?: string | null; filename?: string } }>({
      query: ({ id, data }) => ({ url: `/media/assets/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Media'],
    }),

    deleteMediaAsset: build.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/media/assets/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Media'],
    }),
  }),
});

export const {
  useGetMediaFoldersQuery,
  useCreateMediaFolderMutation,
  useDeleteMediaFolderMutation,
  useGetMediaAssetsQuery,
  useUploadMediaAssetMutation,
  useUpdateMediaAssetMutation,
  useDeleteMediaAssetMutation,
} = mediaApi;
