// lib/pix.ts
//
// Gera o "Copia e Cola" do Pix (padrão BR Code / EMV, definido pelo Banco Central).
// Não depende de nenhuma API externa — é um formato de texto puro que qualquer
// banco/app de pagamento sabe ler. O QR Code é só esse texto codificado visualmente.

interface PixPayloadInput {
  pixKey: string; // chave Pix (CPF, CNPJ, e-mail, telefone ou chave aleatória)
  merchantName: string; // nome do recebedor — máx 25 caracteres, sem acento
  merchantCity: string; // cidade do recebedor — máx 15 caracteres, sem acento
  amount?: number; // valor em reais (ex: 10.00). Se omitido, o pagador digita o valor
  description?: string; // texto curto, aparece no app do pagador
  txId?: string; // identificador da transação, máx 25 caracteres. "***" = genérico
}

function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

function normalize(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, maxLength);
}

// CRC16-CCITT (0xFFFF), exigido pelo padrão EMV ao final do payload
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  description,
  txId = "***",
}: PixPayloadInput): string {
  const gui = tlv("00", "br.gov.bcb.pix");
  const key = tlv("01", pixKey);
  const desc = description ? tlv("02", normalize(description, 40)) : "";
  const merchantAccountInfo = tlv("26", `${gui}${key}${desc}`);

  const payloadFormat = tlv("00", "01");
  const merchantCategoryCode = tlv("52", "0000");
  const currency = tlv("53", "986"); // BRL
  const amountField = amount ? tlv("54", amount.toFixed(2)) : "";
  const country = tlv("58", "BR");
  const name = tlv("59", normalize(merchantName, 25));
  const city = tlv("60", normalize(merchantCity, 15));
  const additionalData = tlv("62", tlv("05", txId));

  const payloadWithoutCrc =
    payloadFormat +
    merchantAccountInfo +
    merchantCategoryCode +
    currency +
    amountField +
    country +
    name +
    city +
    additionalData +
    "6304"; // ID + tamanho fixo do próprio CRC

  const crc = crc16(payloadWithoutCrc);
  return payloadWithoutCrc + crc;
}
