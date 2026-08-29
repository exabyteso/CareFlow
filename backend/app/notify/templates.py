"""SMS/call copy for booking_confirm, no_show, reminder."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class NotifyMessage:
    sms_body: str
    call_script: str | None = None


def booking_confirm_message(*, facility_name: str, locale: str) -> NotifyMessage:
    if locale == "sw":
        return NotifyMessage(
            sms_body=(
                f"CareFlow: Umehifadhi nafasi katika {facility_name}. "
                "Hii si utambuzi — nenda hospitalini ukiwa na dalili."
            ),
            call_script=None,
        )
    return NotifyMessage(
        sms_body=(
            f"CareFlow: You booked {facility_name}. "
            "This is pretriage routing, not a diagnosis."
        ),
        call_script=None,
    )


def no_show_message(*, locale: str) -> NotifyMessage:
    if locale == "sw":
        return NotifyMessage(
            sms_body=(
                "CareFlow: Uliwekwa kama hukuja. Tafadhali weka nafasi tena ikiwa bado unahitaji huduma."
            ),
        )
    return NotifyMessage(
        sms_body=(
            "CareFlow: You were marked as not arrived. Please rebook if you still need care."
        ),
    )


def reminder_message(*, facility_name: str, locale: str) -> NotifyMessage:
    if locale == "sw":
        script = (
            f"Habari. Hii ni ukumbusho wa CareFlow kwa miadi yako katika {facility_name}. "
            "Tafadhali wasili kwa wakati."
        )
        sms = f"CareFlow: Ukumbusho — miadi yako katika {facility_name} inakaribia."
    else:
        script = (
            f"Hello. This is a CareFlow reminder for your appointment at {facility_name}. "
            "Please arrive on time."
        )
        sms = f"CareFlow: Reminder — your appointment at {facility_name} is coming up."
    return NotifyMessage(sms_body=sms, call_script=script)
