import { useState } from "react";
import Button from "../components/common/Button";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import Tab from "../components/common/Tab";
import Checkbox from "../components/common/Checkbox";
import TextField from "../components/common/TextField";
import SelectField from "../components/common/SelectField";
import PairSelectField from "../components/common/PairSelectField";
import SearchBar from "../components/SearchBar";

import CalendarIcon from "@/assets/calendar.svg?react";
import UsersIcon from "@/assets/users.svg?react";
import SwitchIcon from "@/assets/switch.svg?react";
//import NavBar from "./components/common/NavBar";

function App() {
  const [tabIndex, setTabIndex] = useState(0);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* ── Header ── */}
      <section>
        <p className="px-6 py-2 text-body5 text-gray-500">Header_default</p>
        <Header variant="default" />
        <p className="px-6 py-2 text-body5 text-gray-500 mt-4">Header_login</p>
        <Header variant="login" />
      </section>

      {/* ── 검색바 ── */}
      <SearchBar onSearch={(params) => console.log("검색:", params)} />

      {/* ══════════════════════════════════════
          개별 컴포넌트 테스트
          ══════════════════════════════════════  */}
      <div className="flex-1 flex flex-col gap-10 p-10">
        {/* Button */}
        <section>
          <h2 className="font-montserrat text-title2 font-bold mb-4">Button</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <Button btnType="solid">검색하기</Button>
            <Button btnType="outlined">로그인</Button>
            <Button btnType="text">Get Started</Button>
          </div>
          <div className="flex items-center gap-4 flex-wrap mt-3">
            <Button btnType="solid" disabled>
              신청하기
            </Button>
            <Button btnType="outlined" disabled>
              로그인
            </Button>
            <Button btnType="text" disabled>
              Get Started
            </Button>
          </div>
        </section>

        {/* Tab */}
        <section>
          <h2 className="font-montserrat text-title2 font-bold mb-4">Tab</h2>
          <Tab
            items={["편도", "왕복", "다구간"]}
            activeIndex={tabIndex}
            onChange={setTabIndex}
          />
          <p className="text-body3 text-gray-500 mt-3">
            현재 선택: {["편도", "왕복", "다구간"][tabIndex]}
          </p>
        </section>

        {/* Checkbox */}
        <section>
          <h2 className="font-montserrat text-title2 font-bold mb-4">
            Checkbox
          </h2>
          <div className="flex items-center gap-6">
            <Checkbox
              label="동의합니다"
              checked={check1}
              onChange={setCheck1}
            />
            <Checkbox label="선택됨" checked={check2} onChange={setCheck2} />
            <Checkbox label="비활성" disabled />
          </div>
        </section>

        {/* TextField */}
        <section>
          <h2 className="font-montserrat text-title2 font-bold mb-4">
            TextField
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <TextField value="텍스트" />
            <TextField placeholder="비활성" disabled />
          </div>
        </section>

        {/* SelectField */}
        <section>
          <h2 className="font-montserrat text-title2 font-bold mb-4">
            SelectField
          </h2>
          <div className="flex gap-4">
            {/* <div className="max-w-[180px]"> */}
            {/* 회색 배경 */}
            <SelectField
              bg="gray"
              placeholder="가는편"
              rightIcon={<CalendarIcon />}
            />
            <SelectField
              bg="gray"
              value="2026.06.30"
              rightIcon={<CalendarIcon />}
            />
            <SelectField
              bg="gray"
              placeholder="인원/좌석등급"
              leftIcon={<UsersIcon />}
            />

            {/* 흰색 배경 */}
            <SelectField bg="white" placeholder="출발지" />
            {/* </div> */}
          </div>
        </section>

        {/* PairSelectField */}
        <section>
          <h2 className="font-montserrat text-title2 font-bold mb-4">
            PairSelectField
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="max-w-[420px]">
              {/* 회색 배경 */}
              <PairSelectField
                bg="gray"
                leftPlaceholder="출발지"
                rightPlaceholder="도착지"
                centerIcon={<SwitchIcon />}
              />

              <PairSelectField
                bg="gray"
                leftValue="인천"
                rightValue="도쿄"
                centerIcon={<SwitchIcon />}
              />
            </div>
          </div>
        </section>

        {/* NavBar (Mobile) */}
        {/* <section>
          <h2 className="font-montserrat text-title2 font-bold mb-4">NavBar (Mobile)</h2>
          <div className="grid grid-cols-2 gap-4 max-w-[600px]">
            <div>
              <p className="text-body5 text-gray-500 mb-1">nav_default</p>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <NavBar variant="default" />
              </div>
            </div>
            <div>
              <p className="text-body5 text-gray-500 mb-1">nav_login</p>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <NavBar variant="login" />
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-body5 text-gray-500 mb-1">nav_back</p>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <NavBar variant="back" title="워크스페이스명" />
              </div>
            </div>
          </div>
        </section> */}
      </div>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}

export default App;
