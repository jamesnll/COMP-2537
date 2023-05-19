const setup = () => {
    let firstCard = undefined;
    let secondCard = undefined;
    let isFlipping = false;
    $(".card").on(("click"), function () {
        if (isFlipping) {
            return;
        }
        $(this).toggleClass("flip");
  
        if (!firstCard)
            firstCard = $(this).find(".front_face")[0]
        else {
            secondCard = $(this).find(".front_face")[0]
            console.log(firstCard, secondCard);
            if (firstCard === secondCard) {
                return;
            }
            if (firstCard.src == secondCard.src) {
                isFlipping = true;
                console.log("match")
                setTimeout(() => {
                    $(firstCard).parent().off("click");
                    $(secondCard).parent().off("click");
                    firstCard = undefined;
                    secondCard = undefined;
                    isFlipping = false;
                    console.log(isFlipping);
                }, 1000);  
            } else {
                console.log("no match")
                isFlipping = true;
                setTimeout(() => {
                    $(firstCard).parent().toggleClass("flip");
                    $(secondCard).parent().toggleClass("flip");
                    firstCard = undefined;
                    secondCard = undefined;
                    isFlipping = false;
                    console.log(isFlipping);
                }, 1000);  
            }
        }
    });
  }
  
  $(document).ready(setup)