## 💻 Cockple Prontend Team

<br>

| <img src="https://avatars.githubusercontent.com/u/162114710?v=4" width="100" height="100"> | <img src="https://avatars.githubusercontent.com/u/163288437?v=4" width="100" height="100"> | 
|:---:|:---:|
| [김예은](https://github.com/KimYeEun0929) | [은솔](https://github.com/eunsol1530) | 
| Frontend<br>Leader<br> | Frontend<br><br> |



<br>
<br>


<br>
<br>




## 🏗️ 디렉터리 구조 규칙
```
src/
├─ api/ #  공통 axios + 스웨거(도메인) 기준 API 모듈
│ ├─ api.ts # Axios 인스턴스(기본 설정)
│ ├─ workspace/ # 워크스페이스 관련 API (Swagger tag: bookmark)
├─ assets/ # 이미지, 폰트 등 정적 자산
├─ components/ # 재사용 컴포넌트
│ ├─ common/ # 전역 공통 UI(버튼, 입력, 모달 등)
│ ├─ workspace/ # 각 페이지 전용 컴포넌트(=presentational)
├─ constants/ # 상수( 옵션 리스트 등)
├─ hooks/ # 전역 커스텀 훅
├─ layout/ # 라우트 공용 레이아웃(헤더/푸터 등)
├─ pages/ # 라우팅 진입용 페이지 컴포넌트
│ ├─ workspace/
├─ store/ # 전역 상태(Zustand 등)
├─ types/ # 전역 타입 정의(공통 DTO/Response)
└─ utils/ # 순수 유틸 함수(검증/포맷/파서 등)
```



<br>
<br>
<br>
<br>


## 🔧 Tech Stack
<table>
    <thead>
        <tr>
            <th>분류</th>
            <th>기술 스택</th>
        </tr>
    </thead>
    <tbody>
        <tr>
          <td>
            <p>프론트엔드</p>
          </td>
          <td>
            <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=ffffff">
            <img src="https://img.shields.io/badge/react-61DAFB?logo=react&logoColor=333333">
          </td>
        </tr>
        <tr>
            <td>
                <p>패키지 매니저</p>
            </td>
            <td>
              <img src="https://img.shields.io/badge/npm-c12127?logo=npm&logoColor=ffffff">
            </td>
        </tr>
                <tr>
            <td>
                <p>배포</p>
            </td>
            <td>
                <img src="https://img.shields.io/badge/Vercel-000000?logo=Vercel&logoColor=white">
            </td>
        </tr>
        <tr>
            <td>
                <p>협업</p>
            </td>
            <td>
                <img src="https://img.shields.io/badge/Notion-000000?logo=Notion">
                <img src="https://img.shields.io/badge/Figma-F24E1E?logo=Figma&logoColor=ffffff">
            </td>
        </tr>
    </tbody>
</table>

<br>
<br>
<br>




# ☘️ Convention
<br>

## ☘️ 커밋컨벤션

‼️ 콜론 뒤에 한글로 커밋 작성

‼️ **EX| feat: 로그인 기능 개발**

| 태그 | 설명           |
| --- |--------------|
|**feat**   | 새로운 기능 추가     |
| **fix** | 버그 수정   |
| **refactor** | 리팩토링 (기능 변화 없음) |
|  **chore**  |빌드 설정, 패키지 관리 설정 등 (비즈니스 로직 변경 없음)  |
|  **docs** | 문서 수정 (README 등)   | 
| **design**  | CSS 등 사용자 UI 디자인 변경    | 
| **style**  | 코드 포맷, 세미콜론 등 비즈니스 로직에 영향 없는 스타일 수정   | 
| **test**  | 테스트 코드 추가, 수정, 삭제 (비즈니스 로직 변경 없음)   | 
| **chore**  |빌드 설정, 패키지 관리 설정 등 (비즈니스 로직 변경 없음)    | 
| **post**  | 블로그 포스트 관련 작업 (신규 포스트 추가 등)    | 
| **rename**  | 파일 및 폴더 이름만 변경한 경우    | 
| **remove**  | 파일 및 폴더 삭제만 수행한 경우    | 
| **cont**  | 진행중인 작업    | 

<br>

## ☘️ PR컨벤션

대괄호 안에 해당 기능종류와 설명 작성

ex:    **[feat] 로그인 기능 구현**

```
## 📍PR 유형 (하나 이상 선택)

-   [ ] 새로운 기능 추가
-   [ ] 버그 수정
-   [ ] CSS 등 사용자 UI 디자인 변경
-   [ ] 코드에 영향을 주지 않는 변경사항(오타 수정, 탭 사이즈 변경, 변수명 변경)
-   [ ] 코드 리팩토링
-   [ ] 주석 추가 및 수정
-   [ ] 문서 수정
-   [ ] 테스트 추가, 테스트 리팩토링
-   [ ] 빌드 부분 혹은 패키지 매니저 수정
-   [ ] 파일 혹은 폴더명 수정
-   [ ] 파일 혹은 폴더 삭제

##  ✅ PR 체크리스트

<!-- PR이 다음 요구 사항을 충족하는지 확인하세요. -->

-   [ ] 커밋 메시지 컨벤션에 맞게 작성했습니다.
-   [ ] 변경 사항에 대한 테스트를 했습니다.(버그 수정/기능에 대한 테스트).

## ‼️ 관련 이슈

<!-- 이슈 키워드와 함께 #을 입력한 후 이슈 번호를 선택해주세요. -->
<!-- 에시 : resolves #1 -->

resolves #

## 👩🏻‍💻 작업 사항
<!-- 주요 작업 내용을 간단히 작성해주세요.(스크린샷도 있으면 좋아요!) -->

## 📢 기타(공유 사항) 
<!-- 공유할 내용, 추가 논의가 필요한 사항, 배포 시 유의사항 등을 작성해주세요. -->

```

<br>

## ☘️ 브랜치컨벤션

ex:   **feat/#이슈번호**

<br>
<br>


## ☘️ Git Flow

- main: 배포 가능한 안정적인 코드.
- develop: 최신 개발 상태를 유지하는 브랜치.
- feature: 새로운 기능 개발을 위한 브랜치.

<br>
<br>


