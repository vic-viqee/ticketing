import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateQrCodeBuffer } from "@/lib/qrcode";

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica" },
  title: { fontSize: 22, marginBottom: 12 },
  meta: { fontSize: 12, marginBottom: 24, color: "#333" },
  ticketBox: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16 },
  footer: { marginTop: 24, fontSize: 10, color: "#6b7280" },
});

export async function buildTicketPdfBuffer(params: {
  attendeeName: string;
  eventName: string;
  eventDate: string;
  venue: string;
  ticketTier: string;
  qrCodeToken: string;
}) {
  const qrBuffer = await generateQrCodeBuffer(params.qrCodeToken);
  const qrDataUri = `data:image/png;base64,${qrBuffer.toString("base64")}`;

  const doc = (
    <Document>
      <Page size="A6" style={styles.page}>
        <Text style={styles.title}>{params.eventName}</Text>
        <View style={styles.ticketBox}>
          <Text style={styles.meta}>Attendee: {params.attendeeName}</Text>
          <Text style={styles.meta}>Ticket: {params.ticketTier}</Text>
          <Text style={styles.meta}>
            Date: {new Date(params.eventDate).toLocaleString()} · Venue: {params.venue}
          </Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={qrDataUri} style={{ width: 160, height: 160, marginTop: 12 }} />
          <Text style={styles.footer}>Ticket ID: {params.qrCodeToken}</Text>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
