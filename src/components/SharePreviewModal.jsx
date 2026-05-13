import { useRef, useState, useCallback, useEffect } from 'react'
import { X, Download, Share2 } from 'lucide-react'
import { captureToBlob, downloadBlob, shareBlob } from '../lib/shareUtils'

export default function SharePreviewModal({ open, onClose, cardWidth, cardHeight, captureScale = 4, filename, children }) {
  const captureRef = useRef(null)
  const [capturing, setCapturing] = useState(false)
  const [previewScale, setPreviewScale] = useState(0.75)

  useEffect(() => {
    if (!open) return
    const calcScale = () => {
      const maxW = window.innerWidth - 48
      const maxH = window.innerHeight * 0.55
      setPreviewScale(Math.min(maxW / cardWidth, maxH / cardHeight, 1))
    }
    calcScale()
    window.addEventListener('resize', calcScale)
    return () => window.removeEventListener('resize', calcScale)
  }, [open, cardWidth, cardHeight])

  const handleAction = useCallback(async (mode) => {
    if (!captureRef.current || capturing) return
    setCapturing(true)
    try {
      const blob = await captureToBlob(captureRef.current, {
        width: cardWidth,
        height: cardHeight,
        scale: captureScale,
        backgroundColor: '#f1ece1',
      })
      if (mode === 'share') {
        const shared = await shareBlob(blob, filename)
        if (!shared) downloadBlob(blob, filename)
      } else {
        downloadBlob(blob, filename)
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Capture failed:', err)
    } finally {
      setCapturing(false)
    }
  }, [capturing, cardWidth, cardHeight, captureScale, filename])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: '50%', width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white', zIndex: 1,
        }}
      >
        <X size={20} />
      </button>

      {/* Preview card (visible, CSS-scaled for display only) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: cardWidth * previewScale,
          height: cardHeight * previewScale,
          overflow: 'hidden',
          borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{
          transform: `scale(${previewScale})`,
          transformOrigin: 'top left',
        }}>
          <div style={{ width: cardWidth, height: cardHeight, overflow: 'hidden' }}>
            {children}
          </div>
        </div>
      </div>

      {/* Off-screen capture target (NO transform — clean for html2canvas) */}
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
        <div
          ref={captureRef}
          style={{ width: cardWidth, height: cardHeight, overflow: 'hidden' }}
        >
          {children}
        </div>
      </div>

      {/* Action buttons */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', gap: 12, marginTop: 20 }}
      >
        <button
          onClick={() => handleAction('download')}
          disabled={capturing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'white', color: '#14110d',
            border: 'none', borderRadius: 10,
            padding: '12px 20px', fontSize: 14, fontWeight: 800,
            cursor: capturing ? 'not-allowed' : 'pointer',
            opacity: capturing ? 0.6 : 1,
          }}
        >
          <Download size={16} />
          이미지 저장
        </button>
        <button
          onClick={() => handleAction('share')}
          disabled={capturing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#c8202b', color: 'white',
            border: 'none', borderRadius: 10,
            padding: '12px 20px', fontSize: 14, fontWeight: 800,
            cursor: capturing ? 'not-allowed' : 'pointer',
            opacity: capturing ? 0.6 : 1,
          }}
        >
          <Share2 size={16} />
          {capturing ? '생성 중...' : '공유하기'}
        </button>
      </div>
    </div>
  )
}
