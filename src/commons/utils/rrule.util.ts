import { RRule } from 'rrule';

export function isRRuleOverlapping(
  rruleString: string,
  searchStart: Date,
  searchEnd: Date,
): boolean {
  try {
    const rule = RRule.fromString(rruleString);
    // Lấy các lần lặp bắt đầu trong khoảng tìm kiếm
    // Đối với các block bảo trì ngắn, việc kiểm tra điểm bắt đầu là đủ
    const occurrences = rule.between(searchStart, searchEnd, true);
    return occurrences.length > 0;
  } catch (error) {
    console.error('Lỗi khi phân tích RRULE:', error);
    return false;
  }
}