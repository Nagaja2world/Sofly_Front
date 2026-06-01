import { useEffect, useState } from "react";
import {
  fetchHotelDetails,
  type HotelOfferItem,
  type HotelDetailsData,
  type HotelRoom,
} from "@/api/hotelApi";

interface HotelDetailModalProps {
  hotel: HotelOfferItem;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  roomQty: number;
  onClose: () => void;
}

function formatPrice(price: number, currency = "KRW"): string {
  if (currency === "KRW") return `₩${Math.round(price).toLocaleString("ko-KR")}`;
  return `${currency} ${price.toLocaleString()}`;
}

function Stars({ count }: { count: number | null }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: Math.min(Math.round(count), 5) }).map((_, i) => (
        <span key={i} className="text-primary leading-none">★</span>
      ))}
    </div>
  );
}

function RoomCard({ room }: { room: HotelRoom }) {
  const photo = room.photos?.[0]?.url;
  const isFree = room.is_free_cancellable === 1 || room.is_free_cancellable === true;

  return (
    <div className="flex gap-4 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      {photo ? (
        <img
          src={photo}
          alt={room.room_name ?? "객실"}
          className="w-32 h-28 object-cover shrink-0"
        />
      ) : (
        <div className="w-32 h-28 bg-gray-200 shrink-0 flex items-center justify-center">
          <span className="font-pretendard text-body5 text-gray-400">이미지 없음</span>
        </div>
      )}

      <div className="flex flex-1 min-w-0 py-3 pr-4 justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <h4 className="font-pretendard text-body2 font-semibold text-gray-900 m-0 truncate">
            {room.name_without_policy ?? room.room_name ?? "객실"}
          </h4>

          <div className="flex items-center gap-2 flex-wrap">
            {isFree && (
              <span className="font-pretendard text-body5 text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                무료 취소
              </span>
            )}
            {room.max_occupancy != null && (
              <span className="font-pretendard text-body5 text-gray-500">
                최대 {room.max_occupancy}인
              </span>
            )}
            {room.room_surface_in_m2 != null && (
              <span className="font-pretendard text-body5 text-gray-500">
                {room.room_surface_in_m2}m²
              </span>
            )}
          </div>

          {room.highlights && room.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {room.highlights.slice(0, 2).map((h, i) => (
                <span key={i} className="font-pretendard text-body5 text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  {h.translated_name}
                </span>
              ))}
            </div>
          )}
        </div>

        {room.min_price != null && (
          <div className="text-right shrink-0">
            <p className="font-pretendard text-body5 text-gray-400 m-0">1박</p>
            <p className="font-pretendard text-body1 font-bold text-gray-900 m-0">
              {formatPrice(room.min_price.price, room.min_price.currency)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function HotelDetailContent({ data }: { data: HotelDetailsData }) {
  const mainPhoto = data.photos?.[0]?.url_original ?? data.photos?.[0]?.url_max300;
  const rooms = data.block ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* 호텔 기본 정보 */}
      <div className="flex gap-4">
        {mainPhoto && (
          <img
            src={mainPhoto}
            alt={data.hotel_name ?? "호텔"}
            className="w-48 h-36 object-cover rounded-xl shrink-0"
          />
        )}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          {data.review_score != null && (
            <div className="flex items-center gap-2">
              <span className="font-pretendard text-body3 font-bold bg-gray-900 text-white px-2.5 py-1 rounded-lg">
                {data.review_score.toFixed(1)}
              </span>
              {data.review_score_word && (
                <span className="font-pretendard text-body4 text-gray-600">
                  {data.review_score_word}
                </span>
              )}
              {data.review_nr != null && (
                <span className="font-pretendard text-body5 text-gray-400">
                  후기 {data.review_nr.toLocaleString()}개
                </span>
              )}
            </div>
          )}

          {data.address && (
            <p className="font-pretendard text-body4 text-gray-600 m-0">
              {data.address}
              {data.city ? `, ${data.city}` : ""}
            </p>
          )}

          <div className="flex gap-4 mt-1">
            {data.checkin?.from && (
              <div>
                <p className="font-pretendard text-body5 text-gray-400 m-0">체크인</p>
                <p className="font-pretendard text-body4 text-gray-700 m-0">{data.checkin.from}~</p>
              </div>
            )}
            {data.checkout?.until && (
              <div>
                <p className="font-pretendard text-body5 text-gray-400 m-0">체크아웃</p>
                <p className="font-pretendard text-body4 text-gray-700 m-0">~{data.checkout.until}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 객실 목록 */}
      {rooms.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
            이용 가능한 객실
          </h3>
          {rooms.map((room, i) => (
            <RoomCard key={room.block_id ?? i} room={room} />
          ))}
        </div>
      )}

      {rooms.length === 0 && (
        <div className="py-8 text-center">
          <p className="font-pretendard text-body3 text-gray-500 m-0">
            이용 가능한 객실 정보가 없어요
          </p>
        </div>
      )}
    </div>
  );
}

function buildFallbackDetails(hotel: HotelOfferItem): HotelDetailsData {
  return {
    hotel_id: hotel.hotel_id,
    hotel_name: hotel.name,
    url: hotel.property?.bookingUrl ?? hotel.url,
    review_score: hotel.review_score ?? undefined,
    review_score_word: hotel.review_score_word ?? undefined,
    review_nr: hotel.review_nr ?? undefined,
    checkin: hotel.checkin ? { from: hotel.checkin.from } : undefined,
    checkout: hotel.checkout ? { until: hotel.checkout.until } : undefined,
    photos: hotel.main_photo_url
      ? [{ url_original: hotel.main_photo_url, url_max300: hotel.main_photo_url }]
      : [],
    block: [],
    hotel_text: hotel.accessibilityLabel
      ? { description: hotel.accessibilityLabel.replace(/\n/g, " ") }
      : undefined,
  };
}

export default function HotelDetailModal({
  hotel,
  arrivalDate,
  departureDate,
  adults,
  roomQty,
  onClose,
}: HotelDetailModalProps) {
  const [detailData, setDetailData] = useState<HotelDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* detail API url → 백엔드 주입 딥링크(날짜 포함) → 검색 결과 url 순 우선순위 */
  const bookingUrl = detailData?.url ?? hotel.property?.bookingUrl ?? hotel.url;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchHotelDetails({
      hotelId: String(hotel.hotel_id),
      arrivalDate,
      departureDate,
      adults,
      roomQty,
      languageCode: "ko",
      currencyCode: "KRW",
    })
      .then((res) => {
        if (cancelled) return;
        if (res.data) {
          setDetailData(res.data);
        } else {
          setDetailData(buildFallbackDetails(hotel));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("호텔 상세 조회 실패:", err);
        setDetailData(buildFallbackDetails(hotel));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotel, arrivalDate, departureDate, adults, roomQty]);

  /* ESC로 닫기 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Stars count={hotel.class} />
            <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0 truncate">
              {hotel.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 border-none bg-transparent cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* 바디 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              <p className="font-pretendard text-body3 text-gray-500 m-0">
                호텔 정보를 불러오는 중...
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="py-12 text-center">
              <p className="font-pretendard text-body3 text-red-500 m-0">{error}</p>
            </div>
          )}

          {!isLoading && !error && detailData && (
            <HotelDetailContent data={detailData} />
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={[
              "flex items-center justify-center gap-2 w-full py-3 rounded-xl",
              "font-pretendard text-body2 font-semibold text-gray-900 no-underline",
              "bg-primary hover:brightness-95 transition-all cursor-pointer",
            ].join(" ")}
          >
            Booking.com에서 예약하기
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5.5 3H3C2.448 3 2 3.448 2 4v7c0 .552.448 1 1 1h7c.552 0 1-.448 1-1V8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M8 2h4v4M12 2L6.5 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
