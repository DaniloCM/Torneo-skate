$(function(){

    $(document).on("submit", "#form-registro",function(event){
        event.preventDefault();

        const nombre = $("#input-registro-nombre").val(),
        password = $("#input-registro-password").val(),
        repetirPassword = $("#input-registro-repetir-password").val(),
        añosExperiencia = $("#input-registro-años-experiencia").val();

        console.log(nombre, password, repetirPassword,añosExperiencia);

        let pasaValidaciones = true;

        if (añosExperiencia < 0) {
            alert("Los años de experiencia deben ser mayor o igual a 0");
            pasaValidaciones = false;
        }

        if (password !== repetirPassword) {
            alert("El password debe coincidir con su repetición, revisa y vuelve a intentar");
            pasaValidaciones = false;
        }

        if (pasaValidaciones) {
            
            const formSinFoto = $(this)[0];
            const foto = $('#input-registro-foto')[0].files[0];
            var formData = new FormData(formSinFoto);
            formData.append('file', foto);

            console.log("validado");
    
            $.ajax({
                method: 'post',
                url: '/skater',
                dataType: 'json',
                data: formData,
                processData: false,
                contentType: false,
                success: function(data){
                    window.location = `/login?usuario=${nombre}`;
                },
                error: function(error){
                    console.log(error);
                    if(error.status == 403){
                        alert(error.responseJSON.message);
                    } else {
                        alert("Ocurrió un error interno en el servidor");
                    }
                }
            });
        }
    });


    $(document).on("submit", "#form-login",function(event){
        event.preventDefault();

        $.ajax({
            method: 'post',
            url: '/login',
            dataType: 'json',
            data: $(this).serialize(),
            success: function(data){
                // localStorage.setItem("token", token);
                // window.location = `/perfil`;
                window.location = `/perfil?token=${data.token}`;
            },
            error: function(error){
                if(error.status == 403){
                    alert(error.responseJSON.message);
                } else {
                    alert("Ocurrió un error interno en el servidor");
                }
            }
        });
    });


    $(document).on("click", "#btn-perfil-actualizar",function(event){
        event.preventDefault();

        let pasaValidaciones = true;

        const id = $(this).data("id"),
        email = $("#input-perfil-email").val(),
        nombre = $("#input-perfil-nombre").val(),
        password = $("#input-perfil-password").val(),
        repetirPassword = $("#input-perfil-repetir-password").val(),
        añosExperiencia = $("#input-perfil-años-experiencia").val(),
        especialidad = $("#input-perfil-especialidad").val();

        if (añosExperiencia < 0) {
            alert("Los años de experiencia deben ser mayor o igual a 0");
            pasaValidaciones = false;
        }

        if (password !== repetirPassword) {
            alert("El password debe coincidir con su repetición, revisa y vuelve a intentar");
            pasaValidaciones = false;
        }
        
        if(pasaValidaciones) {

            $.ajax({
                method: 'put',
                url: `/skater?id=${id}`,
                dataType: 'json',
                data: {
                    nombre,
                    email,
                    password,
                    añosExperiencia,
                    especialidad
                },
                success: function(data){
                    window.location = `/perfil?token=${data.token}`;
                },
                error: function(error){
                    if(error.status == 403){
                        alert(error.responseJSON.message);
                    } else {
                        alert("Ocurrió un error interno en el servidor");
                    }
                }
            });
        }

    });


    $(document).on("click", "#btn-perfil-eliminar",function(event){
        event.preventDefault();

        const id = $(this).data("id");

        $.ajax({
            method: 'delete',
            url: `/skater?id=${id}`,
            success: function(data){
                window.location = `/?del=${data.respuesta.rows[0].nombre}`;
            },
            error: function(error){
                console.log(error);
                if(error.status == 403){
                    alert(error.responseJSON.message);
                } else {
                    alert("Ocurrió un error interno en el servidor");
                }
            }
        });
    });


    $(document).on("click", ".checkbox-admin",function(event){
        // event.preventDefault();

        const id = $(this).data("id");
        const estado = $(this).is(':checked');

        $.ajax({
            method: 'put',
            url: `/skater/estado?id=${id}&estado=${estado}`,
            error: function(error){
                if(error.status == 403){
                    alert(error.responseJSON.message);
                } else {
                    alert("Ocurrió un error interno en el servidor");
                }
            }
        });
    });
    

});