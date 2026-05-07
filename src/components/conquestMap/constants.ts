import type { VisitStatus } from "@/api/conquestApi";

// ── ISO alpha-2 ↔ alpha-3 ─────────────────────────────────────────────
export const A2_A3: Record<string, string> = {
  AF:"AFG",AX:"ALA",AL:"ALB",DZ:"DZA",AS:"ASM",AD:"AND",AO:"AGO",AI:"AIA",
  AQ:"ATA",AG:"ATG",AR:"ARG",AM:"ARM",AW:"ABW",AU:"AUS",AT:"AUT",AZ:"AZE",
  BS:"BHS",BH:"BHR",BD:"BGD",BB:"BRB",BY:"BLR",BE:"BEL",BZ:"BLZ",BJ:"BEN",
  BM:"BMU",BT:"BTN",BO:"BOL",BQ:"BES",BA:"BIH",BW:"BWA",BV:"BVT",BR:"BRA",
  IO:"IOT",BN:"BRN",BG:"BGR",BF:"BFA",BI:"BDI",CV:"CPV",KH:"KHM",CM:"CMR",
  CA:"CAN",KY:"CYM",CF:"CAF",TD:"TCD",CL:"CHL",CN:"CHN",CX:"CXR",CC:"CCK",
  CO:"COL",KM:"COM",CG:"COG",CD:"COD",CK:"COK",CR:"CRI",CI:"CIV",HR:"HRV",
  CU:"CUB",CW:"CUW",CY:"CYP",CZ:"CZE",DK:"DNK",DJ:"DJI",DM:"DMA",DO:"DOM",
  EC:"ECU",EG:"EGY",SV:"SLV",GQ:"GNQ",ER:"ERI",EE:"EST",SZ:"SWZ",ET:"ETH",
  FK:"FLK",FO:"FRO",FJ:"FJI",FI:"FIN",FR:"FRA",GF:"GUF",PF:"PYF",TF:"ATF",
  GA:"GAB",GM:"GMB",GE:"GEO",DE:"DEU",GH:"GHA",GI:"GIB",GR:"GRC",GL:"GRL",
  GD:"GRD",GP:"GLP",GU:"GUM",GT:"GTM",GG:"GGY",GN:"GIN",GW:"GNB",GY:"GUY",
  HT:"HTI",HM:"HMD",VA:"VAT",HN:"HND",HK:"HKG",HU:"HUN",IS:"ISL",IN:"IND",
  ID:"IDN",IR:"IRN",IQ:"IRQ",IE:"IRL",IM:"IMN",IL:"ISR",IT:"ITA",JM:"JAM",
  JP:"JPN",JE:"JEY",JO:"JOR",KZ:"KAZ",KE:"KEN",KI:"KIR",KP:"PRK",KR:"KOR",
  KW:"KWT",KG:"KGZ",LA:"LAO",LV:"LVA",LB:"LBN",LS:"LSO",LR:"LBR",LY:"LBY",
  LI:"LIE",LT:"LTU",LU:"LUX",MO:"MAC",MG:"MDG",MW:"MWI",MY:"MYS",MV:"MDV",
  ML:"MLI",MT:"MLT",MH:"MHL",MQ:"MTQ",MR:"MRT",MU:"MUS",YT:"MYT",MX:"MEX",
  FM:"FSM",MD:"MDA",MC:"MCO",MN:"MNG",ME:"MNE",MS:"MSR",MA:"MAR",MZ:"MOZ",
  MM:"MMR",NA:"NAM",NR:"NRU",NP:"NPL",NL:"NLD",NC:"NCL",NZ:"NZL",NI:"NIC",
  NE:"NER",NG:"NGA",NU:"NIU",NF:"NFK",MK:"MKD",MP:"MNP",NO:"NOR",OM:"OMN",
  PK:"PAK",PW:"PLW",PS:"PSE",PA:"PAN",PG:"PNG",PY:"PRY",PE:"PER",PH:"PHL",
  PN:"PCN",PL:"POL",PT:"PRT",PR:"PRI",QA:"QAT",RE:"REU",RO:"ROU",RU:"RUS",
  RW:"RWA",BL:"BLM",SH:"SHN",KN:"KNA",LC:"LCA",MF:"MAF",PM:"SPM",VC:"VCT",
  WS:"WSM",SM:"SMR",ST:"STP",SA:"SAU",SN:"SEN",RS:"SRB",SC:"SYC",SL:"SLE",
  SG:"SGP",SX:"SXM",SK:"SVK",SI:"SVN",SB:"SLB",SO:"SOM",ZA:"ZAF",GS:"SGS",
  SS:"SSD",ES:"ESP",LK:"LKA",SD:"SDN",SR:"SUR",SJ:"SJM",SE:"SWE",CH:"CHE",
  SY:"SYR",TW:"TWN",TJ:"TJK",TZ:"TZA",TH:"THA",TL:"TLS",TG:"TGO",TK:"TKL",
  TO:"TON",TT:"TTO",TN:"TUN",TR:"TUR",TM:"TKM",TC:"TCA",TV:"TUV",UG:"UGA",
  UA:"UKR",AE:"ARE",GB:"GBR",US:"USA",UM:"UMI",UY:"URY",UZ:"UZB",VU:"VUT",
  VE:"VEN",VN:"VNM",VG:"VGB",VI:"VIR",WF:"WLF",EH:"ESH",YE:"YEM",ZM:"ZMB",
  ZW:"ZWE",
};

export const A3_A2: Record<string, string> = Object.fromEntries(
  Object.entries(A2_A3).map(([k, v]) => [v, k])
);

export const WV_FILTER = [
  "in", ["get", "worldview"], ["literal", ["all", "US"]],
] as mapboxgl.FilterSpecification;

export const BULK_TEMPLATE = `{
  "countries": [
    { "countryCode": "JP", "status": "VISITED" },
    { "countryCode": "FR", "status": "PLANNED" }
  ],
  "cities": [
    { "cityName": "Tokyo", "countryCode": "JP", "latitude": 35.6762, "longitude": 139.6503, "status": "VISITED" }
  ]
}`;

export const STATUS_LABEL: Record<VisitStatus, string> = {
  VISITED: "방문 완료",
  PLANNED: "방문 예정",
  UNVISITED: "미방문",
};

// ── sofly light theme tokens ──────────────────────────────────────────
export const C = {
  bg: "#fcf9ef",
  white: "#ffffff",
  surface: "rgba(255,255,255,0.95)",
  border: "#f2f2f2",
  borderMid: "#e1e1e1",
  text: "#2b2b2b",
  muted: "#9a9a9a",
  subtle: "#757575",
  primary: "#f5d15a",
  primaryHover: "#d4b23e",
  secondary: "#a0c1d5",
  visited: "#f5d15a",
  planned: "#a0c1d5",
  unvisited: "#e1e1e1",
};

export const STATUS_COLOR: Record<VisitStatus, string> = {
  VISITED: C.visited,
  PLANNED: C.planned,
  UNVISITED: C.unvisited,
};

export const panelBase: React.CSSProperties = {
  position: "absolute",
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  backdropFilter: "blur(12px)",
  boxShadow: "0 8px 24px rgba(43,43,43,0.06)",
  zIndex: 10,
  fontFamily: "Pretendard, -apple-system, sans-serif",
};
