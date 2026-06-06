# 사랑의빛교회 방송용 툴

사랑의빛교회 예배 방송 준비를 돕는 Electron 데스크톱 앱입니다.

## 주요 기능

- 유튜브 방송 제목 생성
- 유튜브 방송 설명 생성
- 카카오톡 공유 메시지 생성
- 성경 본문 범위 검증 및 자동 보정
- 찬송가 번호/제목 자동 표기
- 예배당 디지털 시계 오차 측정
- 예배 시작 카운트다운
- GitHub Releases 기반 자동 업데이트

## 개발 실행

필수 조건:

- Node.js
- npm

설치:

```bash
npm install
```

웹 개발 서버:

```bash
npm run dev
```

Electron 개발 실행:

```bash
npm run electron:dev
```

## 빌드

Windows 설치 파일을 생성합니다.

```bash
npm run build
```

빌드 결과는 `release` 폴더에 생성됩니다.

```text
release/love-light-broadcast-tool-setup-1.0.0.exe
release/love-light-broadcast-tool-setup-1.0.0.exe.blockmap
release/latest.yml
```

사용자에게는 설치 파일인 `love-light-broadcast-tool-setup-1.0.0.exe`를 전달하면 됩니다.

## GitHub Release 배포

이 앱은 `electron-updater`와 `electron-builder`의 GitHub publish 설정을 사용합니다.

릴리즈할 때는 `package.json`의 `version`을 올린 뒤 빌드합니다.

```bash
npm run build
```

그 다음 GitHub Release에 아래 파일을 업로드합니다.

```text
release/love-light-broadcast-tool-setup-<version>.exe
release/love-light-broadcast-tool-setup-<version>.exe.blockmap
release/latest.yml
```

예시:

```bash
git tag v1.0.1
git push origin main
git push origin v1.0.1

gh release create v1.0.1 \
  "release/love-light-broadcast-tool-setup-1.0.1.exe" \
  "release/love-light-broadcast-tool-setup-1.0.1.exe.blockmap" \
  "release/latest.yml" \
  --repo scrafts/love-light-broadcast-tool \
  --title "사랑의빛교회 방송용 툴 1.0.1" \
  --notes "업데이트 내용"
```

## 자동 업데이트

패키징된 앱은 실행 시 GitHub Releases에서 새 버전을 확인합니다.

- 개발 모드에서는 업데이트 확인을 하지 않습니다.
- 새 버전이 있으면 `electron-updater`가 다운로드 및 설치 알림을 처리합니다.
- 자동 업데이트가 작동하려면 GitHub Release에 `latest.yml`, 설치 파일, `.blockmap` 파일이 함께 있어야 합니다.

## 주의 사항

- Windows SmartScreen에서 알 수 없는 게시자 경고가 보일 수 있습니다. 외부 배포가 많아지면 코드 서명 인증서를 고려하세요.
- `release`, `dist`, `dist-electron`, `node_modules`는 Git에 올리지 않습니다.
