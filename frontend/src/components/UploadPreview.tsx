import { Calendar, Camera, MapPin, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'

interface ExifData {
  Make?: string
  Model?: string
  DateTimeOriginal?: string
  GPSLatitude?: number
  GPSLongitude?: number
}

interface UploadPreviewProps {
  exifData: ExifData | null
  isLoading: boolean
  hasError?: boolean
}

export default function UploadPreview({ exifData, isLoading, hasError }: UploadPreviewProps) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-[var(--linen)] bg-[var(--ivory)]/50 flex flex-col items-center justify-center space-y-2 animate-pulse">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--taupe)]">
          <div className="w-3.5 h-3.5 border-2 border-[var(--umber)] border-t-transparent rounded-full animate-spin" />
          사진에서 메타데이터(EXIF) 추출 중...
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50 flex items-center gap-2 text-xs text-rose-600 animate-fade-in">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>EXIF 메타데이터를 분석하는 중 오류가 발생했거나 데이터가 존재하지 않습니다.</span>
      </div>
    )
  }

  if (!exifData || Object.keys(exifData).length === 0) {
    return null
  }

  const { Make, Model, DateTimeOriginal, GPSLatitude, GPSLongitude } = exifData
  const hasGps = typeof GPSLatitude === 'number' && typeof GPSLongitude === 'number'

  // Format YYYY:MM:DD HH:MM:SS to human readable Korean format
  const formatDateTime = (rawStr?: string) => {
    if (!rawStr) return null
    try {
      const parts = rawStr.trim().split(' ')
      if (parts[0]) {
        const dateParts = parts[0].split(':')
        const timeParts = parts[1] ? parts[1].split(':') : []
        
        const year = dateParts[0]
        const month = parseInt(dateParts[1], 10)
        const day = parseInt(dateParts[2], 10)
        
        let timeFormatted = ''
        if (timeParts.length >= 2) {
          timeFormatted = ` ${timeParts[0]}:${timeParts[1]}`
        }
        
        if (year && month && day) {
          return `${year}년 ${month}월 ${day}일${timeFormatted}`
        }
      }
      return rawStr
    } catch (e) {
      return rawStr
    }
  }

  const displayDate = formatDateTime(DateTimeOriginal)
  const cameraDevice = [Make, Model].filter(Boolean).join(' ')

  return (
    <div className="p-4 rounded-xl border border-[var(--linen)] bg-gradient-to-br from-[var(--ivory)] to-[var(--linen)]/20 shadow-sm space-y-3 animate-fade-in transition-all hover:border-[var(--taupe)]/40">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[var(--linen)]/60 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--charcoal)] tracking-wide font-display">
          <Sparkles className="w-3.5 h-3.5 text-[var(--umber)] animate-pulse" />
          사진에서 추출된 정보
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[var(--umber)] font-semibold bg-[var(--linen)]/50 px-2 py-0.5 rounded-full border border-[var(--linen)] animate-fade-in">
          <CheckCircle className="w-3 h-3 text-[var(--umber)]" />
          기록 보관 시 자동 저장됨
        </div>
      </div>

      {/* Grid of Chips */}
      <div className="flex flex-wrap gap-2.5">
        
        {/* Date Time Original */}
        {displayDate && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ivory)] border border-[var(--linen)] text-xs text-[var(--charcoal)] hover:scale-[1.02] hover:bg-white active:scale-98 transition-all shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-[var(--umber)]/70" />
            <div className="flex flex-col text-left">
              <span className="text-[8px] text-[var(--taupe)] font-semibold uppercase tracking-wider">촬영 일시</span>
              <span className="font-medium text-[11px] leading-tight mt-0.5">{displayDate}</span>
            </div>
          </div>
        )}

        {/* Camera/Smartphone model */}
        {cameraDevice && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ivory)] border border-[var(--linen)] text-xs text-[var(--charcoal)] hover:scale-[1.02] hover:bg-white active:scale-98 transition-all shadow-sm">
            <Camera className="w-3.5 h-3.5 text-[var(--umber)]/70" />
            <div className="flex flex-col text-left">
              <span className="text-[8px] text-[var(--taupe)] font-semibold uppercase tracking-wider">촬영 기기</span>
              <span className="font-medium text-[11px] leading-tight mt-0.5">{cameraDevice}</span>
            </div>
          </div>
        )}

        {/* GPS coordinates */}
        {hasGps && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ivory)] border border-[var(--linen)] text-xs text-[var(--charcoal)] hover:scale-[1.02] hover:bg-white active:scale-98 transition-all shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[var(--umber)]/70" />
            <div className="flex flex-col text-left">
              <span className="text-[8px] text-[var(--taupe)] font-semibold uppercase tracking-wider">GPS 위치 정보</span>
              <span className="font-mono text-[10px] text-[var(--graphite)] leading-tight mt-0.5">
                {GPSLatitude?.toFixed(5)}°, {GPSLongitude?.toFixed(5)}°
              </span>
            </div>
          </div>
        )}
        
      </div>
      
    </div>
  )
}
