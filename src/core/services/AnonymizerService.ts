export class AnonymizerService {
  /**
   * Scrubs PII like NDIS numbers and replaces names with initials or placeholders.
   * Basic mock implementation.
   */
  public static scrub(text: string, participantName?: string): string {
    let scrubbed = text;
    
    // Scrub NDIS numbers (9 digit numbers)
    scrubbed = scrubbed.replace(/\b\d{9}\b/g, '[NDIS_NUMBER]');
    
    // Scrub participant name if provided
    if (participantName) {
      const names = participantName.split(' ');
      names.forEach(name => {
        if (name.length > 2) {
          const regex = new RegExp(`\\b${name}\\b`, 'gi');
          scrubbed = scrubbed.replace(regex, '[PARTICIPANT]');
        }
      });
    }

    return scrubbed;
  }
}
