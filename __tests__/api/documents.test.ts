import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/patients/[id]/documents/route'
import { POST } from '@/app/api/documents/route'

const { mockPrisma, mockDocuments } = vi.hoisted(() => {
  const docs = [
    { id: '1', name: 'test.pdf', url: 'http://test/test.pdf', type: 'application/pdf', size: 1024, patientId: 'p1' }
  ]
  return {
    mockDocuments: docs,
    mockPrisma: {
      document: {
        findMany: vi.fn().mockResolvedValue(docs),
        create: vi.fn().mockResolvedValue(docs[0])
      }
    }
  }
})

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

vi.mock('@azure/storage-blob', () => {
  return {
    BlobServiceClient: {
      fromConnectionString: vi.fn().mockReturnValue({
        getContainerClient: vi.fn().mockReturnValue({
          createIfNotExists: vi.fn().mockResolvedValue(true),
          getBlockBlobClient: vi.fn().mockReturnValue({
            uploadData: vi.fn().mockResolvedValue(true),
            url: 'http://mockazure.com/test.pdf'
          })
        })
      })
    }
  }
})

describe('Documents API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/patients/[id]/documents', () => {
    it('should return documents for a patient', async () => {
      const request = new Request('http://localhost/api/patients/p1/documents')
      const response = await GET(request, { params: { id: 'p1' } })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveLength(1)
      expect(data[0].name).toBe('test.pdf')
      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { patientId: 'p1' },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should require patient ID', async () => {
      const request = new Request('http://localhost/api/patients//documents')
      const response = await GET(request, { params: { id: '' } })
      
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/documents', () => {
    it('should require file and patientId', async () => {
      const formData = new FormData()
      const request = new Request('http://localhost/api/documents', {
        method: 'POST',
        body: formData
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should reject invalid file types', async () => {
      const formData = new FormData()
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      formData.append('file', file)
      formData.append('patientId', 'p1')
      
      const request = new Request('http://localhost/api/documents', {
        method: 'POST',
        body: formData
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.message).toContain('Invalid file type')
    })
  })
})
