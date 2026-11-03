/** Check content without stripping joiners, emoji selectors, or other characters
 * from messages. Formatting/spacing/control characters alone are not content.
 * @param {string} text
 */
export function hasMessageContent(text) {
  return /[^\p{White_Space}\p{Default_Ignorable_Code_Point}\p{Cc}]/u.test(text);
}
