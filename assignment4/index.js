const setup = () => {
    let firstCard = undefined
    let secondCard = undefined
    $(".card").on(("click"), function () {
      $(this).toggleClass("flip");
  
      if (!firstCard)
        firstCard = $(this).find(".front_face")[0]
      else {
        secondCard = $(this).find(".front_face")[0]
        console.log(firstCard, secondCard);
        if (
          firstCard.src
          ==
          secondCard.src
        ) {
          console.log("match")
          $(firstCard).parent().off("click");
          $(secondCard).parent().off("click");
          firstCard = undefined;
          secondCard = undefined;
        } else {
          console.log("no match")
          setTimeout(() => {
            $(firstCard).parent().toggleClass("flip");
            $(secondCard).parent().toggleClass("flip");
            firstCard = undefined;
            secondCard = undefined;
          }, 1000);
          
        }
      }
    });
  }
  
  $(document).ready(setup)