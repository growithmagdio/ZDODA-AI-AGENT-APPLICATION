from zdoda_voice.speech import speakable


def test_phone_numbers_are_read_digit_by_digit():
    out = speakable("Call +1 (555) 010-2020 today")
    assert "one five five five zero one zero two zero two zero" in out


def test_links_and_symbols_are_spoken():
    out = speakable("See https://x.com & save 20% **now**")
    assert "https" not in out and " and " in out and "percent" in out and "*" not in out
