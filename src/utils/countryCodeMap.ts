/** 국가명(한국어/영어) → ISO-3166-1 alpha-2 코드 */
const NAME_TO_CODE: Record<string, string> = {
  // 한국어
  '대한민국': 'KR', '한국': 'KR',
  '미국': 'US', '미합중국': 'US',
  '일본': 'JP',
  '중국': 'CN', '중화인민공화국': 'CN',
  '이탈리아': 'IT',
  '프랑스': 'FR',
  '독일': 'DE',
  '영국': 'GB',
  '스페인': 'ES',
  '포르투갈': 'PT',
  '그리스': 'GR',
  '터키': 'TR', '튀르키예': 'TR',
  '태국': 'TH',
  '베트남': 'VN',
  '싱가포르': 'SG',
  '말레이시아': 'MY',
  '인도네시아': 'ID',
  '필리핀': 'PH',
  '홍콩': 'HK',
  '대만': 'TW',
  '인도': 'IN',
  '캐나다': 'CA',
  '멕시코': 'MX',
  '브라질': 'BR',
  '아르헨티나': 'AR',
  '호주': 'AU',
  '뉴질랜드': 'NZ',
  '이집트': 'EG',
  '모로코': 'MA',
  '남아프리카공화국': 'ZA', '남아프리카': 'ZA',
  '네덜란드': 'NL',
  '벨기에': 'BE',
  '스위스': 'CH',
  '오스트리아': 'AT',
  '체코': 'CZ',
  '폴란드': 'PL',
  '헝가리': 'HU',
  '크로아티아': 'HR',
  '러시아': 'RU',
  '스웨덴': 'SE',
  '노르웨이': 'NO',
  '덴마크': 'DK',
  '핀란드': 'FI',
  '아일랜드': 'IE',
  '아랍에미리트': 'AE',
  '이스라엘': 'IL',
  '요르단': 'JO',
  '캄보디아': 'KH',
  '미얀마': 'MM',
  '스리랑카': 'LK',
  '네팔': 'NP',
  '몰디브': 'MV',
  '쿠바': 'CU',
  '페루': 'PE',
  '칠레': 'CL',
  '콜롬비아': 'CO',
  '체코공화국': 'CZ',
  '슬로바키아': 'SK',
  '루마니아': 'RO',
  '불가리아': 'BG',
  '세르비아': 'RS',
  '슬로베니아': 'SI',
  '몬테네그로': 'ME',
  '알바니아': 'AL',
  '북마케도니아': 'MK',
  '보스니아헤르체고비나': 'BA',
  '라오스': 'LA',
  '방글라데시': 'BD',
  '파키스탄': 'PK',
  '카자흐스탄': 'KZ',
  '우즈베키스탄': 'UZ',
  '조지아': 'GE',
  '아르메니아': 'AM',
  '아제르바이잔': 'AZ',
  '이란': 'IR',
  '사우디아라비아': 'SA',
  '쿠웨이트': 'KW',
  '바레인': 'BH',
  '카타르': 'QA',
  '오만': 'OM',

  // 영어
  'Italy': 'IT',
  'France': 'FR',
  'Germany': 'DE',
  'Spain': 'ES',
  'Portugal': 'PT',
  'Greece': 'GR',
  'Turkey': 'TR', 'Türkiye': 'TR',
  'United Kingdom': 'GB', 'UK': 'GB', 'England': 'GB',
  'United States': 'US', 'USA': 'US',
  'Japan': 'JP',
  'China': 'CN',
  'South Korea': 'KR', 'Korea': 'KR',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Singapore': 'SG',
  'Malaysia': 'MY',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'Hong Kong': 'HK',
  'Taiwan': 'TW',
  'India': 'IN',
  'Australia': 'AU',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'New Zealand': 'NZ',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Czech Republic': 'CZ', 'Czechia': 'CZ',
  'Poland': 'PL',
  'Hungary': 'HU',
  'Croatia': 'HR',
  'Russia': 'RU',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Ireland': 'IE',
  'Egypt': 'EG',
  'Morocco': 'MA',
  'South Africa': 'ZA',
  'United Arab Emirates': 'AE', 'UAE': 'AE',
  'Israel': 'IL',
  'Jordan': 'JO',
  'Cambodia': 'KH',
  'Myanmar': 'MM',
  'Sri Lanka': 'LK',
  'Nepal': 'NP',
  'Maldives': 'MV',
  'Cuba': 'CU',
  'Peru': 'PE',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Saudi Arabia': 'SA',
  'Qatar': 'QA',
  'Kuwait': 'KW',
  'Bahrain': 'BH',
  'Oman': 'OM',
};

/**
 * Places API formattedAddress에서 ISO-2 국가 코드를 추출합니다.
 *
 * 지원 패턴:
 *   - "이탈리아"               → 주소 자체가 국가명
 *   - "대한민국 전북..."        → 앞부분이 국가명 (한국/일본 주소 방식)
 *   - "..., CA 94110 미국"     → 쉼표 뒤 마지막 단어가 국가명 (서양 주소 방식)
 */
export function countryCodeFromAddress(formattedAddress: string): string | null {
  const addr = formattedAddress.trim();

  // 1. 주소 전체가 국가명인 경우
  const exact = NAME_TO_CODE[addr];
  if (exact) return exact;

  // 2. 쉼표로 분리 → 마지막 세그먼트의 마지막 단어 (서양식: "..., 미국" or "..., Italy")
  const commaParts = addr.split(',');
  if (commaParts.length > 1) {
    const lastSeg = commaParts[commaParts.length - 1].trim();
    const byLastSeg = NAME_TO_CODE[lastSeg];
    if (byLastSeg) return byLastSeg;
    // "CA 94110 미국" 같은 형태 → 마지막 단어만
    const lastWord = lastSeg.split(' ').pop()?.trim() ?? '';
    const byLastWord = NAME_TO_CODE[lastWord];
    if (byLastWord) return byLastWord;
  }

  // 3. 쉼표 없는 경우 → 첫 번째 단어 (한국/일본식: "대한민국 경기도...")
  const firstWord = addr.split(' ')[0].trim();
  const byFirstWord = NAME_TO_CODE[firstWord];
  if (byFirstWord) return byFirstWord;

  return null;
}
