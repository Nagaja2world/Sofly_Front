import { type HotelOfferItem } from "@/api/hotelApi";

interface HotelCardProps {
  hotel: HotelOfferItem;
  onClick?: () => void;
}

function Stars({ count }: { count: number | null }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: Math.min(Math.round(count), 5) }).map((_, i) => (
        <span key={i} className="text-primary leading-none">
          ★
        </span>
      ))}
    </div>
  );
}

function formatPrice(amount: number, currency: string): string {
  return currency === "KRW"
    ? `₩${Math.round(amount).toLocaleString("ko-KR")}`
    : `${currency} ${Math.round(amount).toLocaleString()}`;
}

export default function HotelCard({ hotel, onClick }: HotelCardProps) {
  const price =
    hotel.min_total_price ??
    hotel.composite_price_breakdown?.gross_amount?.value;
  const currency =
    hotel.composite_price_breakdown?.gross_amount?.currency ?? "KRW";
  const formattedPrice = price == null ? null : formatPrice(price, currency);
  const formattedStrikethrough =
    hotel.strikethrough_price != null && hotel.strikethrough_price > (price ?? 0)
      ? formatPrice(hotel.strikethrough_price, currency)
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="flex bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* 썸네일 */}
      {hotel.main_photo_url ? (
        <img
          src={hotel.main_photo_url}
          alt={hotel.name}
          className="w-52 h-40 object-cover shrink-0"
        />
      ) : (
        <div className="w-52 h-40 bg-gray-100 shrink-0 flex items-center justify-center">
          <span className="font-pretendard text-body4 text-gray-400">
            이미지 없음
          </span>
        </div>
      )}

      {/* 정보 */}
      <div className="flex flex-1 min-w-0 p-4 justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Stars count={hotel.class} />
            {hotel.is_free_cancellable && (
              <span className="font-pretendard text-body5 text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                무료 취소
              </span>
            )}
            {hotel.badges?.slice(0, 2).map((b) => (
              <span
                key={b.id}
                className="font-pretendard text-body5 text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded"
              >
                {b.text}
              </span>
            ))}
          </div>

          <h3 className="font-pretendard text-body1 font-semibold text-gray-900 m-0 truncate">
            {hotel.name}
          </h3>

          {hotel.distance_to_cc && (
            <p className="font-pretendard text-body4 text-gray-500 m-0">
              중심지에서 {hotel.distance_to_cc}km
            </p>
          )}

          <div className="flex items-center gap-3 mt-auto flex-wrap">
            {hotel.checkin?.from && (
              <span className="font-pretendard text-body5 text-gray-400">
                체크인 {hotel.checkin.from}
              </span>
            )}
            {hotel.checkout?.until && (
              <span className="font-pretendard text-body5 text-gray-400">
                체크아웃 {hotel.checkout.until}
              </span>
            )}
          </div>
        </div>

        {/* 평점 + 가격 */}
        <div className="flex flex-col items-end justify-between shrink-0 gap-2">
          {hotel.review_score != null && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-pretendard text-body3 font-bold bg-gray-900 text-white px-2.5 py-1 rounded-lg">
                {hotel.review_score.toFixed(1)}
              </span>
              {hotel.review_score_word && (
                <span className="font-pretendard text-body5 text-gray-500">
                  {hotel.review_score_word}
                </span>
              )}
              {hotel.review_nr != null && (
                <span className="font-pretendard text-body5 text-gray-400">
                  후기 {hotel.review_nr.toLocaleString()}개
                </span>
              )}
            </div>
          )}

          {formattedPrice && (
            <div className="text-right">
              <p className="font-pretendard text-body5 text-gray-400 m-0">
                1박
              </p>
              {formattedStrikethrough && (
                <p className="font-pretendard text-body5 text-gray-400 line-through m-0">
                  {formattedStrikethrough}
                </p>
              )}
              <p className="font-pretendard text-title3 font-bold text-gray-900 m-0">
                {formattedPrice}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
